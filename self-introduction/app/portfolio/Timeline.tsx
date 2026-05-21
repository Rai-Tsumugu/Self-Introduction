import "../timeline/p2a3/style.css";
import rawData from "../timeline/data.json";

type Point = { id: string; kind: "point"; date: string; title: string; category: string; tags: string[]; summary: string; color: string };
type Span = { id: string; kind: "span"; start: string; end: string; title: string; category: string; tags: string[]; summary: string; color: string };
type CategoryConfig = { key: string; label?: string };
type TimelineData = {
  scale: { pxPerMonth: number };
  range?: { start: string | null; end: string | null };
  categories?: CategoryConfig[];
  events: Point[];
  spans: Span[];
};

const data = rawData as TimelineData;

function ym(s: string) { const [y, m] = s.split("-").map(Number); return { y, m }; }
function ymToIndex(s: string, origin: { y: number; m: number }) { const b = ym(s); return (b.y - origin.y) * 12 + (b.m - origin.m); }

function computeRange(): { start: string; end: string } {
  if (data.range?.start && data.range?.end) return { start: data.range.start, end: data.range.end };
  const all: string[] = [];
  for (const e of data.events) all.push(e.date);
  for (const s of data.spans) { all.push(s.start); all.push(s.end); }
  const sorted = [...all].sort();
  return { start: data.range?.start ?? sorted[0], end: data.range?.end ?? sorted[sorted.length - 1] };
}

function packSpans(spans: Span[], mi: (s: string) => number) {
  const sorted = [...spans].sort((a, b) => mi(a.start) - mi(b.start) || mi(b.end) - mi(a.end));
  const colEnds: number[] = [];
  const assignments = new Map<string, number>();
  for (const s of sorted) {
    const sMi = mi(s.start), eMi = mi(s.end);
    let placed = colEnds.findIndex((e) => e < sMi);
    if (placed === -1) { placed = colEnds.length; colEnds.push(eMi); } else { colEnds[placed] = eMi; }
    assignments.set(s.id, placed);
  }
  return { assignments, cols: colEnds.length };
}

export default function Timeline() {
  const pxPerMonth = data.scale.pxPerMonth;
  const { start: RANGE_START, end: RANGE_END } = computeRange();
  const origin = ym(RANGE_START);
  const monthIndex = (s: string) => ymToIndex(s, origin);
  const months = monthIndex(RANGE_END) + 1;
  const totalH = months * pxPerMonth;
  const yOfMonth = (mi: number) => (months - 1 - mi) * pxPerMonth;

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

  const SUB_W = 30, SUB_GAP = 6, PAD = 12;

  return (
    <div className="p2a3-board">
      <div className="p2a3-gutter" style={{ height: totalH }}>
        {monthLabels.map((ml) => (
          <div key={ml.mi} className={"p2a3-tick" + (ml.isYear ? " is-year" : "")} style={{ top: yOfMonth(ml.mi) }}>
            <span className="mono">{ml.label}</span>
          </div>
        ))}
      </div>

      <div className="p2a3-lanes">
        {cats.map((cat) => {
          const laneSpans = spans.filter((s) => s.category === cat.key);
          const lanePoints = events.filter((e) => e.category === cat.key);
          const pack = packSpans(laneSpans, monthIndex);
          const cols = Math.max(1, pack.cols);
          const stripeW = cols * SUB_W + (cols - 1) * SUB_GAP;
          const laneMinW = stripeW + PAD * 2 + 40;
          return (
            <div key={cat.key} className="p2a3-lane" style={{ height: totalH, minWidth: laneMinW }}>
              <div className="p2a3-lane-head">
                <span className="p2a3-lane-label">{cat.label ?? cat.key}</span>
                <span className="p2a3-lane-badge mono">· {cols} parallel</span>
              </div>
              <div className="p2a3-lane-body" style={{ height: totalH }}>
                {laneSpans.map((s) => {
                  const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
                  const top = yOfMonth(eMi);
                  const h = (eMi - sMi + 1) * pxPerMonth;
                  const col = pack.assignments.get(s.id) ?? 0;
                  return (
                    <div key={s.id} className="p2a3-stripe" style={{ top, height: h, left: PAD + col * (SUB_W + SUB_GAP), width: SUB_W, background: `color-mix(in srgb, ${s.color} 30%, var(--bg))`, borderColor: `color-mix(in srgb, ${s.color} 55%, var(--line))` }}>
                      <div className="p2a3-stripe-cap" style={{ background: `color-mix(in srgb, ${s.color} 70%, var(--ink))` }} />
                      <div className="p2a3-stripe-label serif">{s.title}</div>
                      <div className="p2a3-popover" style={{ borderLeftColor: `color-mix(in srgb, ${s.color} 65%, var(--line))` }}>
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

                {lanePoints.map((e) => (
                  <div key={e.id} className="p2a3-point" style={{ top: yOfMonth(monthIndex(e.date)), left: PAD + stripeW / 2 - 5 }}>
                    <span className="p2a3-dot" style={{ background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }} />
                    <div className="p2a3-point-pop">
                      <div className="p2a3-pop-title serif">{e.title}</div>
                      <div className="p2a3-pop-meta mono">{e.date}</div>
                      <div className="p2a3-pop-summary">{e.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
