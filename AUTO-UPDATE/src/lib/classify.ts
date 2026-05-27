import type { TimelineCategory } from "../types.js";

const RULES: { keywords: RegExp; category: TimelineCategory; color: string }[] = [
  {
    keywords: /(hackathon|hacks|ideathon|ハッカソン|アイデアソン|コンテスト|受賞|award)/i,
    category: "hackathon",
    color: "#ef4444",
  },
  {
    keywords: /(授業|講義|試験|期末|レポート|学期|履修|大学|class|lecture|exam|semester)/i,
    category: "school",
    color: "#10b981",
  },
  {
    keywords: /(プロジェクト|開発|リリース|deploy|sprint|kickoff|MTG|定例|project)/i,
    category: "project",
    color: "#f59e0b",
  },
];

const LABEL_MAP: Record<string, { category: TimelineCategory; color: string }> = {
  school: { category: "school", color: "#10b981" },
  project: { category: "project", color: "#f59e0b" },
  hackathon: { category: "hackathon", color: "#ef4444" },
  personal: { category: "extraAct", color: "#6366f1" },
};

export function classifyEvent(input: {
  summary?: string | null;
  description?: string | null;
  sourceLabel?: string | null;
}): { category: TimelineCategory; color: string } {
  if (input.sourceLabel && LABEL_MAP[input.sourceLabel]) {
    return LABEL_MAP[input.sourceLabel];
  }
  const text = `${input.summary ?? ""} ${input.description ?? ""}`;
  for (const rule of RULES) {
    if (rule.keywords.test(text)) {
      return { category: rule.category, color: rule.color };
    }
  }
  return { category: "extraAct", color: "#6366f1" };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}
