import { execFile } from "node:child_process";
import { promisify } from "node:util";
import OpenAI from "openai";
import type { PublicRepo } from "./github.js";
import { callChatgptResponses } from "./codex-oauth.js";

const execFileP = promisify(execFile);

export interface GeneratedWork {
  name: string;
  desc: string;
  tags: string[];
}

const SYSTEM_PROMPT = `あなたはポートフォリオ編集者です。GitHubリポジトリの情報から、日本語の自己紹介サイトに掲載する短い説明文を生成してください。

ルール:
- name: 日本語/英語どちらでも可、20文字以内、簡潔なプロダクト名
- desc: 60〜90字、何のためのプロダクトかを端的に。「〜です・ます」調は使わず体言止めで終わる
- tags: 3個。技術スタックや属性（例: "React", "TypeScript", "個人開発", "学習用"）
- 必ず JSON のみを返す。説明・前置きなし`;

type AuthMode = "api-key" | "codex-cli" | "chatgpt-oauth";

function resolveAuthMode(): AuthMode {
  const v = (process.env.OPENAI_AUTH_MODE ?? "api-key").toLowerCase();
  if (v === "chatgpt-oauth" || v === "oauth") return "chatgpt-oauth";
  if (v === "codex-cli" || v === "codex") return "codex-cli";
  return "api-key";
}

function buildUserPayload(repo: PublicRepo, readme: string | null): string {
  return JSON.stringify({
    repo: repo.fullName,
    description: repo.description,
    language: repo.language,
    topics: repo.topics,
    homepage: repo.homepage,
    readmeExcerpt: readme?.slice(0, 2000) ?? null,
  });
}

function extractJson(text: string): GeneratedWork | null {
  const candidates = text.match(/\{[\s\S]*\}/g) ?? [];
  for (const c of candidates.reverse()) {
    try {
      const obj = JSON.parse(c) as Partial<GeneratedWork>;
      if (
        typeof obj.name === "string" &&
        typeof obj.desc === "string" &&
        Array.isArray(obj.tags) &&
        obj.tags.every((t) => typeof t === "string")
      ) {
        return { name: obj.name, desc: obj.desc, tags: obj.tags.slice(0, 3) };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function generateViaApiKey(repo: PublicRepo, readme: string | null): Promise<GeneratedWork | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set (OPENAI_AUTH_MODE=api-key)");

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const res = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPayload(repo, readme) },
    ],
    temperature: 0.4,
  });

  const raw = res.choices[0]?.message?.content;
  return raw ? extractJson(raw) : null;
}

async function generateViaCodexCli(repo: PublicRepo, readme: string | null): Promise<GeneratedWork | null> {
  const bin = process.env.CODEX_CLI_BIN ?? "codex";
  const prompt = `${SYSTEM_PROMPT}

入力JSON:
${buildUserPayload(repo, readme)}

出力は必ず { "name": "...", "desc": "...", "tags": ["...","...","..."] } の形式のJSONのみ。`;

  // Codex CLI を非対話モードで実行。タイムアウトを設けて応答が来なければ中断
  try {
    const { stdout } = await execFileP(
      bin,
      ["exec", "--skip-git-repo-check", prompt],
      { timeout: 120_000, maxBuffer: 4 * 1024 * 1024 },
    );
    return extractJson(stdout);
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT") {
      throw new Error(
        `Codex CLI (\`${bin}\`) が見つかりません。\`npm i -g @openai/codex\` 等でインストールし、\`codex login\` で ChatGPT アカウントにログインしてください。`,
      );
    }
    throw new Error(`Codex CLI failed: ${err.message}${err.stderr ? "\n" + err.stderr : ""}`);
  }
}

async function generateViaChatgptOAuth(repo: PublicRepo, readme: string | null): Promise<GeneratedWork | null> {
  const userPrompt = `次のGitHubリポジトリ情報から、指定形式のJSONのみを返答してください。

${buildUserPayload(repo, readme)}

出力は必ず { "name": "...", "desc": "...", "tags": ["...","...","..."] } のJSONのみ。前置きも後付け説明も禁止。`;

  const text = await callChatgptResponses({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  });
  return extractJson(text);
}

export async function generateWorkMetadata(repo: PublicRepo, readme: string | null): Promise<GeneratedWork | null> {
  const mode = resolveAuthMode();
  if (mode === "chatgpt-oauth") return generateViaChatgptOAuth(repo, readme);
  if (mode === "codex-cli") return generateViaCodexCli(repo, readme);
  return generateViaApiKey(repo, readme);
}
