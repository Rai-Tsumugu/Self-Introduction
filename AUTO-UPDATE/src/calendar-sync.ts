import "dotenv/config";
import { fetchCalendarEvents } from "./lib/google-calendar.js";
import { readJson, writeJson } from "./lib/data-store.js";
import { classifyEvent, slugify } from "./lib/classify.js";
import type { TimelineEvent, TimelineJson } from "./types.js";

interface CalendarSource {
  label: string | null;
  calendarId: string;
}

function parseCalendarIds(): CalendarSource[] {
  const raw = process.env.GOOGLE_CALENDAR_IDS ?? process.env.GOOGLE_CALENDAR_ID;
  if (!raw) throw new Error("GOOGLE_CALENDAR_IDS is not set");

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(":");
      // "xxx@group.calendar.google.com" にはコロンが含まれないので安全
      // ラベル付きの場合のみ "label:id" 形式
      if (idx > 0 && !entry.slice(0, idx).includes("@") && !entry.slice(0, idx).includes(".")) {
        return { label: entry.slice(0, idx).trim(), calendarId: entry.slice(idx + 1).trim() };
      }
      return { label: null, calendarId: entry };
    });
}

function toIsoDate(d: { date?: string | null; dateTime?: string | null }): string | null {
  if (d.date) return d.date;
  if (d.dateTime) return d.dateTime.slice(0, 10);
  return null;
}

async function main(): Promise<void> {
  const sources = parseCalendarIds();
  console.log(`[calendar-sync] ${sources.length} calendar(s) configured`);

  const now = new Date();
  const timeMin = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
  const timeMax = new Date(now.getTime() + 90 * 24 * 3600 * 1000);

  const timeline = await readJson<TimelineJson>("timeline.json");
  const existingIds = new Set(timeline.events.map((e) => e.id));

  let totalAdded = 0;

  for (const src of sources) {
    const tag = src.label ?? src.calendarId;
    console.log(`[calendar-sync] === ${tag} ===`);

    let events;
    try {
      events = await fetchCalendarEvents({
        calendarId: src.calendarId,
        timeMin,
        timeMax,
      });
    } catch (e) {
      console.warn(`[calendar-sync]  fetch failed: ${(e as Error).message}`);
      continue;
    }
    console.log(`[calendar-sync]  got ${events.length} events`);

    for (const ev of events) {
      const start = toIsoDate({ date: ev.start?.date, dateTime: ev.start?.dateTime });
      const end = toIsoDate({ date: ev.end?.date, dateTime: ev.end?.dateTime });
      const title = ev.summary?.trim();
      if (!start || !title) continue;

      const idBase = src.label ? `${src.label}-${slugify(title)}` : slugify(title);
      const id = `evt-${start}-${idBase}`;
      if (existingIds.has(id)) continue;

      const { category, color } = classifyEvent({
        summary: ev.summary,
        description: ev.description,
        sourceLabel: src.label,
      });
      const isSpan = ev.start?.date && ev.end?.date && end && end !== start;

      const tags = ["calendar"];
      if (src.label) tags.push(src.label);

      const next: TimelineEvent = isSpan
        ? {
            id,
            kind: "span",
            start,
            end: end!,
            title,
            category,
            tags,
            summary: ev.description?.slice(0, 200) ?? undefined,
            color,
          }
        : {
            id,
            kind: "point",
            date: start,
            title,
            category,
            tags,
            summary: ev.description?.slice(0, 200) ?? undefined,
            color,
          };

      timeline.events.push(next);
      existingIds.add(id);
      totalAdded += 1;
      console.log(`[calendar-sync]   + ${id}  ${title}`);
    }
  }

  timeline.events.sort((a, b) => {
    const ad = a.date ?? a.start ?? "";
    const bd = b.date ?? b.start ?? "";
    return bd.localeCompare(ad);
  });

  await writeJson("timeline.json", timeline);
  console.log(`[calendar-sync] done. added=${totalAdded}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
