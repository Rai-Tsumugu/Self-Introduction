import "dotenv/config";
import { listPublicRepos, fetchReadme } from "./lib/github.js";
import { generateWorkMetadata } from "./lib/openai.js";
import { readJson, writeJson } from "./lib/data-store.js";
import type { Work, WorksJson } from "./types.js";

async function main(): Promise<void> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) throw new Error("GITHUB_USERNAME is not set");

  console.log(`[github-sync] listing public repos for ${username}`);
  const repos = await listPublicRepos(username);
  console.log(`[github-sync] got ${repos.length} repos`);

  const works = await readJson<WorksJson>("works.json", []);
  const existing = new Set(works.map((w) => w.repo));

  const additions: Work[] = [];
  for (const repo of repos) {
    if (existing.has(repo.fullName)) continue;

    console.log(`[github-sync]  ? new repo: ${repo.fullName} — generating metadata`);
    const readme = await fetchReadme(repo.fullName);
    let meta;
    try {
      meta = await generateWorkMetadata(repo, readme);
    } catch (e) {
      console.warn(`[github-sync]    OpenAI failed: ${(e as Error).message}`);
      continue;
    }
    if (!meta) {
      console.warn(`[github-sync]    skipped (invalid metadata)`);
      continue;
    }

    additions.push({
      repo: repo.fullName,
      name: meta.name,
      desc: meta.desc,
      tags: meta.tags,
      live: repo.homepage && repo.homepage.startsWith("http") ? repo.homepage : null,
    });
    console.log(`[github-sync]  + ${repo.fullName} — ${meta.name}`);
  }

  if (additions.length === 0) {
    console.log("[github-sync] no new repos. done.");
    return;
  }

  const next = [...additions, ...works];
  await writeJson("works.json", next);
  console.log(`[github-sync] done. added=${additions.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
