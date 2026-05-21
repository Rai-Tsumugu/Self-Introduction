import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2A-5 — Zigzag Leader Lines" };

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

const SLOT_H = 88;
const CARD_W = 180;
const SIDE_PAD = 200;

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

  const SUB_W = 14, SUB_GAP = 3, CENTER_PAD = 10;

  return (
    <main className="p2a5-wrap">
      <header className="p2a5-head">
        <div className="pf-eyebrow">Timeline · Variant P2A-5</div>
        <h1 className="pf-h1">Zigzag <em>Leader Lines</em></h1>
        <p className="pf-lede">カードを左右交互の外側スロットに割当て、垂直に空いている位置まで押し下げる。SVG カーブで本体に対応。テキスト矩形は構造的に被らない。</p>
      </header>

      <div className="p2a5-board">
        <div className="p2a5-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div key={ml.mi} className={"p2a5-tick" + (ml.isYear ? " is-year" : "")} style={{ top: yOfMonth(ml.mi) }}>
              <span className="mono">{ml.label}</span>
            </div>
          ))}
        </div>

        <div className="p2a5-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const pack = packSpans(laneSpans);
            const cols = Math.max(1, pack.cols);
            const stripeW = cols * SUB_W + (cols - 1) * SUB_GAP;
            const centerW = stripeW + CENTER_PAD * 2;
            const laneMinW = SIDE_PAD * 2 + centerW;

            // alternate left/right, then slot-down to avoid overlap
            const sorted = [...laneSpans].sort((a, b) => monthIndex(b.end) - monthIndex(a.end));
            const placements = new Map<string, { side: "L" | "R"; top: number }>();
            const sideBottoms: Record<"L" | "R", number> = { L: -10, R: -10 };
            sorted.forEach((s, i) => {
              const side: "L" | "R" = i % 2 === 0 ? "R" : "L";
              const ideal = yOfMonth(monthIndex(s.end));
              const top = Math.max(ideal, sideBottoms[side] + 12);
              placements.set(s.id, { side, top });
              sideBottoms[side] = top + SLOT_H;
            });
            const laneH = Math.max(totalH, sideBottoms.L + 20, sideBottoms.R + 20);

            return (
              <div key={cat} className="p2a5-lane" style={{ height: laneH, minWidth: laneMinW }}>
                <div className="p2a5-lane-head">
                  <span className="p2a5-lane-label">{cat}</span>
                  <span className="p2a5-lane-badge mono">· {cols} parallel</span>
                </div>
                <div className="p2a5-lane-body" style={{ height: laneH }}>
                  <svg className="p2a5-leaders" width="100%" height={laneH} preserveAspectRatio="none">
                    {laneSpans.map((s) => {
                      const top = yOfMonth(monthIndex(s.end));
                      const col = pack.assignments.get(s.id) ?? 0;
                      const p = placements.get(s.id)!;
                      const stripeX = SIDE_PAD + CENTER_PAD + col * (SUB_W + SUB_GAP) + SUB_W / 2;
                      const cardX = p.side === "L" ? SIDE_PAD - 8 : SIDE_PAD + centerW + 8;
                      const y1 = top + 4;
                      const y2 = p.top + 14;
                      const cx = (stripeX + cardX) / 2;
                      return <path key={s.id} d={`M ${stripeX} ${y1} C ${cx} ${y1} ${cx} ${y2} ${cardX} ${y2}`} stroke={s.color} strokeWidth={1.3} fill="none" opacity={0.6} />;
                    })}
                  </svg>

                  {laneSpans.map((s) => {
                    const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
                    const top = yOfMonth(eMi);
                    const h = (eMi - sMi + 1) * pxPerMonth;
                    const col = pack.assignments.get(s.id) ?? 0;
                    return (
                      <div key={s.id} className="p2a5-stripe" style={{ top, height: h, left: SIDE_PAD + CENTER_PAD + col * (SUB_W + SUB_GAP), width: SUB_W, background: `color-mix(in srgb, ${s.color} 35%, var(--bg))`, borderColor: `color-mix(in srgb, ${s.color} 55%, var(--line))` }}>
                        <div className="p2a5-stripe-cap" style={{ background: `color-mix(in srgb, ${s.color} 70%, var(--ink))` }} />
                      </div>
                    );
                  })}

                  {laneSpans.map((s) => {
                    const p = placements.get(s.id)!;
                    const left = p.side === "L" ? SIDE_PAD - 8 - CARD_W : SIDE_PAD + centerW + 8;
                    return (
                      <div key={s.id} className={"p2a5-card is-" + p.side.toLowerCase()} style={{ top: p.top, left, width: CARD_W, height: SLOT_H - 8, borderColor: `color-mix(in srgb, ${s.color} 55%, var(--line))` }}>
                        <div className="p2a5-card-title serif">{s.title}</div>
                        <div className="p2a5-card-meta mono">{s.start} → {s.end}</div>
                        <div className="p2a5-card-tags">
                          {s.tags.map((t) => <span key={t} className="p2a5-tag mono">{t}</span>)}
                        </div>
                      </div>
                    );
                  })}

                  {lanePoints.map((e) => (
                    <div key={e.id} className="p2a5-point" style={{ top: yOfMonth(monthIndex(e.date)), left: SIDE_PAD + CENTER_PAD + stripeW / 2 - 5 }}>
                      <span className="p2a5-dot" style={{ background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }} />
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
