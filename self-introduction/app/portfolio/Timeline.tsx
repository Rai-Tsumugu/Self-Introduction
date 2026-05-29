'use client';

import { useSyncExternalStore } from "react";
import rawData from "../data/timeline.json";

type Point = { id: string; kind: "point"; date: string; title: string; category: string; tags: string[]; summary: string; color: string; group?: string; offsetDays?: number };
type Span = { id: string; kind: "span"; start: string; end: string; title: string; category: string; tags: string[]; summary: string; color: string; group?: string; startOffsetDays?: number; endOffsetDays?: number };
type CategoryConfig = { key: string; label?: string };
type TimelineData = {
  scale: { pxPerMonth: number };
  range?: { start: string | null; end: string | null };
  categories?: CategoryConfig[];
  events: Point[];
  spans: Span[];
};

type TimelineRawData = Omit<TimelineData, "events" | "spans"> & {
  events: Array<Point | Span>;
  spans: Span[];
};

const rawTimelineData = rawData as TimelineRawData;
const isPoint = (item: Point | Span): item is Point => item.kind === "point" && typeof (item as Point).date === "string";
const isSpan = (item: Point | Span): item is Span => item.kind === "span" && typeof (item as Span).start === "string" && typeof (item as Span).end === "string";
const rawEvents = Array.isArray(rawTimelineData.events) ? rawTimelineData.events : [];
const rawSpans = Array.isArray(rawTimelineData.spans) ? rawTimelineData.spans : [];
const normalizedSpans = rawSpans.filter(isSpan);
const normalizedSpanIds = new Set(normalizedSpans.map((span) => span.id));

for (const span of rawEvents.filter(isSpan)) {
  if (!normalizedSpanIds.has(span.id)) {
    normalizedSpans.push(span);
    normalizedSpanIds.add(span.id);
  }
}

const data: TimelineData = {
  ...rawTimelineData,
  events: rawEvents.filter(isPoint),
  spans: normalizedSpans,
};

function ym(s: string) { const [y, m] = s.split("-").map(Number); return { y, m }; }
function ymToIndex(s: string, origin: { y: number; m: number }) { const b = ym(s); return (b.y - origin.y) * 12 + (b.m - origin.m); }
function toYm(s: string) { const { y, m } = ym(s); return `${y}-${String(m).padStart(2, "0")}`; }

function ymd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d: Number.isFinite(d) ? d : 1 };
}
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
// 日付に offset(日数) を加算した結果を、原点からの分数月インデックスで返す。
// edge="start" → その日の開始位置、"end" → 翌日開始位置(=その日の終了位置)。
function dateToFracIndex(s: string, origin: { y: number; m: number }, edge: "start" | "end", offsetDays = 0) {
  const { y, m, d } = ymd(s);
  const base = new Date(y, m - 1, d);
  base.setDate(base.getDate() + offsetDays + (edge === "end" ? 1 : 0));
  const ny = base.getFullYear(), nm = base.getMonth() + 1, nd = base.getDate();
  return (ny - origin.y) * 12 + (nm - origin.m) + (nd - 1) / daysInMonth(ny, nm);
}

function addMonths(ymStr: string, n: number): string {
  const { y, m } = ym(ymStr);
  const t = y * 12 + (m - 1) + n;
  const ny = Math.floor(t / 12);
  const nm = (t % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

function dataMaxYm(): string {
  const all: string[] = [];
  for (const e of data.events) all.push(toYm(e.date));
  for (const s of data.spans) { all.push(toYm(s.start)); all.push(toYm(s.end)); }
  all.sort();
  return all[all.length - 1] ?? "2000-01";
}

function dataMinYm(): string {
  const all: string[] = [];
  for (const e of data.events) all.push(toYm(e.date));
  for (const s of data.spans) { all.push(toYm(s.start)); all.push(toYm(s.end)); }
  all.sort();
  return all[0] ?? "2000-01";
}

function ymOfDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// SSR と初期 CSR で必ず同一になる決定的なレンジ（data.range もしくはデータから算出）。
function computeRangeDeterministic(): { start: string; end: string } {
  const start = data.range?.start ? toYm(data.range.start) : dataMinYm();
  const end = data.range?.end ? toYm(data.range.end) : addMonths(dataMaxYm(), 2);
  return { start, end };
}

// クライアント mount 後に「最初の記録 〜 今日+1週間」のレンジに切り替える。
function rangeTodayToNextWeek(): { start: string; end: string } {
  const start = data.range?.start ? toYm(data.range.start) : dataMinYm();
  const plusWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const end = ymOfDate(plusWeek);
  return { start, end };
}

function packSpans(spans: Span[], points: Point[], mi: (s: string) => number) {
  const spanGroupKey = (s: Span) => s.group ?? `__s_${s.id}`;
  const pointGroupKey = (p: Point) => p.group ?? `__p_${p.id}`;
  const groupMap = new Map<string, { start: number; end: number; key: string }>();
  for (const s of spans) {
    const k = spanGroupKey(s);
    const sMi = mi(s.start), eMi = mi(s.end);
    const cur = groupMap.get(k);
    if (!cur) groupMap.set(k, { start: sMi, end: eMi, key: k });
    else { cur.start = Math.min(cur.start, sMi); cur.end = Math.max(cur.end, eMi); }
  }
  for (const p of points) {
    const k = pointGroupKey(p);
    const pMi = mi(p.date);
    const cur = groupMap.get(k);
    if (!cur) groupMap.set(k, { start: pMi, end: pMi, key: k });
    else { cur.start = Math.min(cur.start, pMi); cur.end = Math.max(cur.end, pMi); }
  }
  const sortedGroups = [...groupMap.values()].sort((a, b) => a.start - b.start || b.end - a.end);
  const colEnds: number[] = [];
  const groupCol = new Map<string, number>();
  for (const g of sortedGroups) {
    let placed = colEnds.findIndex((e) => e < g.start);
    if (placed === -1) { placed = colEnds.length; colEnds.push(g.end); } else { colEnds[placed] = Math.max(colEnds[placed], g.end); }
    groupCol.set(g.key, placed);
  }
  const assignments = new Map<string, number>();
  for (const s of spans) assignments.set(s.id, groupCol.get(spanGroupKey(s)) ?? 0);
  const pointAssignments = new Map<string, number>();
  for (const p of points) pointAssignments.set(p.id, groupCol.get(pointGroupKey(p)) ?? 0);
  return { assignments, pointAssignments, cols: colEnds.length, groupCol };
}

export default function Timeline() {
  const pxPerMonth = data.scale.pxPerMonth;
  const deterministicRange = computeRangeDeterministic();
  const RANGE_START = useSyncExternalStore(
    () => () => {},
    () => rangeTodayToNextWeek().start,
    () => deterministicRange.start,
  );
  const RANGE_END = useSyncExternalStore(
    () => () => {},
    () => rangeTodayToNextWeek().end,
    () => deterministicRange.end,
  );
  const origin = ym(RANGE_START);
  const monthIndex = (s: string) => ymToIndex(s, origin);
  const months = monthIndex(RANGE_END) + 1;
  const totalH = months * pxPerMonth;
  const yOfMonth = (mi: number) => (months - 1 - mi) * pxPerMonth;
  const yOfFrac = (fi: number) => (months - fi) * pxPerMonth;
  const fracStart = (s: string, off = 0) => dateToFracIndex(s, origin, "start", off);
  const fracEnd = (s: string, off = 0) => dateToFracIndex(s, origin, "end", off);

  const events = data.events;
  const spans = data.spans;

  const usedCats: string[] = [];
  for (const it of [...spans, ...events]) if (!usedCats.includes(it.category)) usedCats.push(it.category);
  const cats: CategoryConfig[] = data.categories
    ? data.categories.filter((c) => usedCats.includes(c.key))
        .concat(usedCats.filter((k) => !data.categories!.some((c) => c.key === k)).map((k) => ({ key: k })))
    : usedCats.map((k) => ({ key: k }));

  const monthLabels = Array.from({ length: months }).map((_, i) => {
    const t = origin.y * 12 + (origin.m - 1) + i;
    const y = Math.floor(t / 12), m = (t % 12) + 1;
    return { mi: i, label: m === 1 || i === 0 ? `${y}.${String(m).padStart(2, "0")}` : String(m).padStart(2, "0"), isYear: m === 1 };
  });

  const SUB_W = 30, SUB_GAP = 6, PAD = 12, HEADER_H = 42;

  return (
    <div className="p2a3-board">
      <div className="p2a3-gutter" style={{ height: totalH }}>
        {monthLabels.map((ml) => (
          <div key={ml.mi} className={"p2a3-tick" + (ml.isYear ? " is-year" : "")} style={{ top: yOfMonth(ml.mi) + pxPerMonth }}>
            <span className="mono">{ml.label}</span>
          </div>
        ))}
      </div>

      <div className="p2a3-lanes">
        {cats.map((cat) => {
          const laneSpans = spans.filter((s) => s.category === cat.key);
          const lanePoints = events.filter((e) => e.category === cat.key);
          const pack = packSpans(laneSpans, lanePoints, monthIndex);
          const cols = Math.max(1, pack.cols);
          const stripeW = cols * SUB_W + (cols - 1) * SUB_GAP;
          const laneMinW = stripeW + PAD * 2 + 40;
          return (
            <div key={cat.key} className="p2a3-lane" style={{ height: totalH, minWidth: laneMinW }}>
              <div className="p2a3-lane-head">
                <span className="p2a3-lane-label">{cat.label ?? cat.key}</span>
              </div>
              <div className="p2a3-lane-body" style={{ height: totalH }}>
                {laneSpans.map((s) => {
                  const sFi = fracStart(s.start, s.startOffsetDays ?? 0);
                  const eFi = fracEnd(s.end, s.endOffsetDays ?? 0);
                  const visibleEFi = Math.min(eFi, months);
                  const ongoing = eFi > months;
                  const rawTop = yOfFrac(visibleEFi);
                  const rawH = (visibleEFi - sFi) * pxPerMonth;
                  const top = ongoing ? HEADER_H : rawTop;
                  const h = ongoing ? Math.max(0, rawH - HEADER_H) : rawH;
                  const col = pack.assignments.get(s.id) ?? 0;
                  return (
                    <div key={s.id} className={"p2a3-stripe" + (ongoing ? " is-ongoing" : "")} style={{ top, height: h, left: PAD + col * (SUB_W + SUB_GAP), width: SUB_W, background: `color-mix(in srgb, ${s.color} 12%, transparent)`, borderColor: `color-mix(in srgb, ${s.color} 20%, transparent)`, ["--ev-color" as never]: s.color } as React.CSSProperties}>
                      {!ongoing && <div className="p2a3-stripe-cap" style={{ background: `color-mix(in srgb, ${s.color} 22%, transparent)` }} />}
                      <div className="p2a3-stripe-label serif">{s.title}</div>
                      <div className="p2a3-popover" style={{ borderLeftColor: `color-mix(in srgb, ${s.color} 22%, transparent)` }}>
                        <div className="p2a3-pop-title serif">{s.title}</div>
                        <div className="p2a3-pop-meta mono">{s.start} → {s.end}</div>
                        <div className="p2a3-pop-summary">{s.summary}</div>
                        <div className="p2a3-pop-tags">
                          {s.tags.map((t) => <span key={t} className="p2a3-tag mono">{t}</span>)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {lanePoints.map((e) => {
                  const assignedCol = pack.pointAssignments.get(e.id);
                  const groupedCol = e.group ? pack.groupCol.get(e.group) : undefined;
                  const col = groupedCol ?? assignedCol;
                  const left = col !== undefined
                    ? PAD + col * (SUB_W + SUB_GAP)
                    : PAD + (laneSpans.length > 0 ? stripeW + 10 : 0);
                  return (
                  <div
                    key={e.id}
                    className={"p2a3-point" + (col !== undefined ? " is-grouped" : "")}
                    style={{
                      top: yOfFrac(fracEnd(e.date, e.offsetDays ?? 0)),
                      left,
                      borderLeftColor: `color-mix(in srgb, ${e.color} 22%, transparent)`,
                      ["--ev-color" as never]: e.color,
                    } as React.CSSProperties}
                  >
                    <span
                      className="p2a3-point-bar"
                      style={{ background: `color-mix(in srgb, ${e.color} 22%, transparent)` }}
                    />
                    <div className="p2a3-point-title serif">{e.title}</div>
                    <div className="p2a3-point-date mono">{e.date}</div>
                    <div className="p2a3-point-pop">
                      <div className="p2a3-pop-title serif">{e.title}</div>
                      <div className="p2a3-pop-meta mono">{e.date}</div>
                      <div className="p2a3-pop-summary">{e.summary}</div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
