import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const REFRESH_URL = "https://auth.openai.com/oauth/token";
const RESPONSES_URL = "https://chatgpt.com/backend-api/codex/responses";
const REFRESH_THRESHOLD_MS = 25 * 60 * 1000;

interface AuthDotJson {
  OPENAI_API_KEY?: string | null;
  tokens?: {
    id_token?: string;
    access_token: string;
    refresh_token: string;
    account_id?: string | null;
  };
  last_refresh?: string;
}

function authPath(): string {
  return process.env.CODEX_AUTH_PATH ?? join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "auth.json");
}

async function loadAuth(): Promise<AuthDotJson> {
  const path = authPath();
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as AuthDotJson;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      throw new Error(
        `${path} が見つかりません。Codex CLI をインストールして \`codex login\` を実行してください（npm i -g @openai/codex）。`,
      );
    }
    throw err;
  }
}

async function saveAuth(data: AuthDotJson): Promise<void> {
  await writeFile(authPath(), JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
}

function parseJwtClaim(jwt: string, key: string): string | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof json[key] === "string" ? json[key] : null;
  } catch {
    return null;
  }
}

async function refreshTokens(auth: AuthDotJson): Promise<AuthDotJson> {
  if (!auth.tokens?.refresh_token) {
    throw new Error("refresh_token が auth.json に存在しません。`codex login` で再認証してください。");
  }
  const res = await fetch(REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: auth.tokens.refresh_token,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Token refresh failed (${res.status}): ${body}\n→ refresh_token 期限切れの可能性があります。\`codex login\` で再認証してください。`,
    );
  }

  const json = (await res.json()) as { id_token?: string; access_token?: string; refresh_token?: string };

  const next: AuthDotJson = {
    ...auth,
    tokens: {
      ...auth.tokens,
      id_token: json.id_token ?? auth.tokens.id_token,
      access_token: json.access_token ?? auth.tokens.access_token,
      refresh_token: json.refresh_token ?? auth.tokens.refresh_token,
      account_id:
        auth.tokens.account_id ??
        (json.id_token ? parseJwtClaim(json.id_token, "chatgpt_account_id") : null),
    },
    last_refresh: new Date().toISOString(),
  };
  await saveAuth(next);
  return next;
}

async function getAccessToken(): Promise<{ accessToken: string; accountId: string | null }> {
  let auth = await loadAuth();
  if (!auth.tokens) throw new Error("auth.json に tokens がありません。`codex login` で再認証してください。");

  const last = auth.last_refresh ? Date.parse(auth.last_refresh) : 0;
  const age = Date.now() - last;
  if (age > REFRESH_THRESHOLD_MS) {
    auth = await refreshTokens(auth);
  }
  const accountId =
    auth.tokens!.account_id ??
    (auth.tokens!.id_token ? parseJwtClaim(auth.tokens!.id_token, "chatgpt_account_id") : null);
  return { accessToken: auth.tokens!.access_token, accountId };
}

export interface ChatgptResponseTurn {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}

export async function callChatgptResponses(turn: ChatgptResponseTurn): Promise<string> {
  const { accessToken, accountId } = await getAccessToken();
  const model = turn.model ?? process.env.OPENAI_MODEL ?? "gpt-5-codex";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "OpenAI-Beta": "responses=experimental",
    originator: "auto-update-portfolio",
  };
  if (accountId) headers["ChatGPT-Account-ID"] = accountId;

  // ChatGPT backend は stream: true 必須。SSE を読み取って output_text を累積する。
  const body = {
    model,
    instructions: turn.systemPrompt,
    input: [
      { role: "user", content: [{ type: "input_text", text: turn.userPrompt }] },
    ],
    stream: true,
    store: false,
  };

  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: { ...headers, Accept: "text/event-stream" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`ChatGPT Responses API failed (${res.status}): ${errBody}`);
  }

  return readResponsesStream(res.body);
}

async function readResponsesStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let collected = "";
  let finalText: string | null = null;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE はイベントを 空行 (\n\n) で区切る
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);

      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (dataLines.length === 0) continue;
      const dataStr = dataLines.join("\n");
      if (dataStr === "[DONE]") continue;

      let parsed: any;
      try {
        parsed = JSON.parse(dataStr);
      } catch {
        continue;
      }

      const type = parsed.type as string | undefined;
      // text delta (Responses API)
      if (type === "response.output_text.delta" && typeof parsed.delta === "string") {
        collected += parsed.delta;
      }
      // 完了時に最終テキストが入ってくることがある
      if (type === "response.completed" && parsed.response?.output_text) {
        finalText = parsed.response.output_text as string;
      }
      // ContentBlock の追加経由 (古い形)
      if (type === "response.output_text" && typeof parsed.text === "string") {
        finalText = parsed.text;
      }
      // エラーイベント
      if (type === "response.error" || type === "error") {
        throw new Error(`Responses stream error: ${JSON.stringify(parsed).slice(0, 500)}`);
      }
    }
  }

  const text = finalText ?? collected;
  if (!text) {
    throw new Error("ChatGPT Responses API: ストリームから出力テキストを取得できませんでした");
  }
  return text;
}
