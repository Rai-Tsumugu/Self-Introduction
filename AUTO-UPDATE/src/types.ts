export type TimelineCategory = "hackathon" | "extraAct" | "project" | "school";

export interface TimelineEvent {
  id: string;
  kind: "point" | "span";
  date?: string;
  start?: string;
  end?: string;
  title: string;
  category: TimelineCategory;
  group?: string;
  tags?: string[];
  summary?: string;
  color?: string;
}

export interface TimelineJson {
  scale: { pxPerMonth: number; note?: string };
  range: { start: string | null; end: string | null; note?: string };
  categories: { key: string; label: string }[];
  events: TimelineEvent[];
  [k: string]: unknown;
}

export interface Work {
  repo: string;
  name: string;
  desc: string;
  tags: string[];
  live: string | null;
  featured?: boolean;
}

export type WorksJson = Work[];
