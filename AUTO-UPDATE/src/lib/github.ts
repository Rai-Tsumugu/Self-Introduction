import { Octokit } from "octokit";

export interface PublicRepo {
  fullName: string;        // owner/name
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  homepage: string | null;
  createdAt: string;
  pushedAt: string;
  fork: boolean;
}

export async function listPublicRepos(username: string): Promise<PublicRepo[]> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
    username,
    type: "owner",
    sort: "created",
    direction: "desc",
    per_page: 100,
  });

  return repos
    .filter((r) => !r.private && !r.fork)
    .map((r) => ({
      fullName: r.full_name,
      name: r.name,
      description: r.description,
      language: r.language ?? null,
      topics: r.topics ?? [],
      homepage: r.homepage ?? null,
      createdAt: r.created_at ?? "",
      pushedAt: r.pushed_at ?? "",
      fork: r.fork,
    }));
}

export async function fetchReadme(fullName: string): Promise<string | null> {
  const [owner, repo] = fullName.split("/");
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    return content.slice(0, 4000);
  } catch {
    return null;
  }
}
