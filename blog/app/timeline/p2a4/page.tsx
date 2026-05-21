import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2A-4 — Numbered Outboard Legend" };

type Point = { id: string; kind: "point"; date: string; title: string; category: string; tags: string[]; summary: string; color: string };
type Span = { id: string; kind: "span"; start: string; end: string; title: string; category: string; tags: string[]; summary: string; color: string };

const RANGE_START = "2024-04"; const RANGE_END = "2025-02";

function ym(s: string) { const [y, m] = s.split("-").map(Number); return { y, m }; }
function monthIndex(s: string) { const a = ym(RANGE_START); const b = ym(s); return (b.y - a.y) * 12 + (b.m - a.m); }
function totalMonths() { return monthIndex(RANGE_END) + 1; }

function packSpans(spans: Span[]) {
  const sorted = [...spans].sort((a, b) => monthIndex(a.start) - monthIndex(b.start) || monthIndex(b.end) - monthIndex(a.end));
  const colEnds: number[] = []; const assignments = new Map<string, number>();
  for (const s of sorted) {
    const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
    let placed = colEnds.findIndex((e) => e < sMi);
    if (placed === -1) { placed = colEnds.length; colEnds.push(eMi); } else { colEnds[placed] = eMi; }
    assignments.set(s.id, placed);
  }
  return { assignments, cols: colEnds.length };
}

export default function Page() {
  const pxPerMonth = data.scale.pxPerMonth;
  const months = totalMonths();
  const totalH = months * pxPerMonth;
  const events = data.events as Point[];
  const spans = data.spans as Span[];
  const yOfMonth = (mi: number) => (months - 1 - mi) * pxPerMonth;

  const cats: string[] = [];
  for (const it of [...spans, ...events]) if (!cats.includes(it.category)) cats.push(it.category);

  const monthLabels = Array.from({ length: months }).map((_, i) => {
    const a = ym(RANGE_START); const t = a.y * 12 + (a.m - 1) + i;
    const y = Math.floor(t / 12), m = (t % 12) + 1;
    return { mi: i, label: m === 1 || i === 0 ? `${y}.${String(m).padStart(2, "0")}` : String(m).padStart(2, "0"), isYear: m === 1 };
  });

  const SUB_W = 22, SUB_GAP = 5, PAD = 10;

  // assign numbers per lane (1..N), order by start asc
  const numberMap = new Map<string, number>();
  for (const cat of cats) {
    const laneSpans = [...spans.filter((s) => s.category === cat)].sort((a, b) => monthIndex(b.end) - monthIndex(a.end));
    laneSpans.forEach((s, i) => numberMap.set(s.id, i + 1));
  }

  return (
    <main className="p2a4-wrap">
      <header className="p2a4-head">
        <div className="pf-eyebrow">Timeline · Variant P2A-4</div>
        <h1 className="pf-h1">Numbered <em>Outboard Legend</em></h1>
        <p className="pf-lede">ストライプには番号バッジのみ。詳細は下に通常フローで並ぶ凡例カードに集約。タイムライン本体にテキストを置かないので、並列数が増えても破綻しない。</p>
      </header>

      <div className="p2a4-board">
        <div className="p2a4-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div key={ml.mi} className={"p2a4-tick" + (ml.isYear ? " is-year" : "")} style={{ top: yOfMonth(ml.mi) }}>
              <span className="mono">{ml.label}</span>
            </div>
          ))}
        </div>

        <div className="p2a4-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const pack = packSpans(laneSpans);
            const cols = Math.max(1, pack.cols);
            const stripeW = cols * SUB_W + (cols - 1) * SUB_GAP;
            const laneMinW = stripeW + PAD * 2 + 20;
            const orderedSpans = [...laneSpans].sort((a, b) => monthIndex(b.end) - monthIndex(a.end));
            return (
              <div key={cat} className="p2a4-lane" style={{ minWidth: laneMinW }}>
                <div className="p2a4-lane-head">
                  <span className="p2a4-lane-label">{cat}</span>
                  <span className="p2a4-lane-badge mono">· {cols} parallel · {laneSpans.length} items</span>
                </div>
                <div className="p2a4-lane-body" style={{ height: totalH }}>
                  {laneSpans.map((s) => {
                    const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
                    const top = yOfMonth(eMi);
                    const h = (eMi - sMi + 1) * pxPerMonth;
                    const col = pack.assignments.get(s.id) ?? 0;
                    const num = numberMap.get(s.id) ?? 0;
                    return (
                      <div key={s.id} className="p2a4-stripe" style={{ top, height: h, left: PAD + col * (SUB_W + SUB_GAP), width: SUB_W, background: `color-mix(in srgb, ${s.color} 35%, var(--bg))`, borderColor: `color-mix(in srgb, ${s.color} 55%, var(--line))` }}>
                        <div className="p2a4-stripe-cap" style={{ background: `color-mix(in srgb, ${s.color} 70%, var(--ink))` }} />
                        <div className="p2a4-num mono">{num}</div>
                      </div>
                    );
                  })}

                  {lanePoints.map((e) => (
                    <div key={e.id} className="p2a4-point" style={{ top: yOfMonth(monthIndex(e.date)), left: PAD + stripeW / 2 - 5 }}>
                      <span className="p2a4-dot" style={{ background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }} />
                    </div>
                  ))}
                </div>
                <div className="p2a4-legend">
                  <div className="p2a4-legend-head mono">Legend</div>
                  {orderedSpans.map((s) => (
                    <div key={s.id} className="p2a4-legend-row" style={{ borderLeftColor: `color-mix(in srgb, ${s.color} 70%, var(--line))` }}>
                      <span className="p2a4-legend-num mono" style={{ background: `color-mix(in srgb, ${s.color} 70%, var(--ink))` }}>{numberMap.get(s.id)}</span>
                      <div className="p2a4-legend-body">
                        <div className="p2a4-legend-title serif">{s.title}</div>
                        <div className="p2a4-legend-meta mono">{s.start} → {s.end}</div>
                        <div className="p2a4-legend-sum">{s.summary}</div>
                      </div>
                    </div>
                  ))}
                  {lanePoints.map((e) => (
                    <div key={e.id} className="p2a4-legend-row" style={{ borderLeftColor: `color-mix(in srgb, ${e.color} 70%, var(--line))` }}>
                      <span className="p2a4-legend-num mono is-point">●</span>
                      <div className="p2a4-legend-body">
                        <div className="p2a4-legend-title serif">{e.title}</div>
                        <div className="p2a4-legend-meta mono">{e.date}</div>
                        <div className="p2a4-legend-sum">{e.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
