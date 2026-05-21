import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2A-2 — Multi-Column Callouts" };

type Point = { id: string; kind: "point"; date: string; title: string; category: string; tags: string[]; summary: string; color: string };
type Span = { id: string; kind: "span"; start: string; end: string; title: string; category: string; tags: string[]; summary: string; color: string };

const RANGE_START = "2024-04";
const RANGE_END = "2025-02";

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

const CARD_H = 80, CARD_GAP = 6;

function packCards(items: { id: string; top: number }[]) {
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const colBottoms: number[] = [];
  const assignments = new Map<string, number>();
  for (const it of sorted) {
    let placed = colBottoms.findIndex((b) => b + CARD_GAP <= it.top);
    if (placed === -1) { placed = colBottoms.length; colBottoms.push(it.top + CARD_H); } else { colBottoms[placed] = it.top + CARD_H; }
    assignments.set(it.id, placed);
  }
  return { assignments, cols: colBottoms.length };
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

  const SUB_W = 14, SUB_GAP = 3, PAD = 10, CARD_W = 170, CARD_GAP_X = 8;

  return (
    <main className="p2a2-wrap">
      <header className="p2a2-head">
        <div className="pf-eyebrow">Timeline · Variant P2A-2</div>
        <h1 className="pf-h1">Multi-Column <em>Callouts</em></h1>
        <p className="pf-lede">詳細カードを右側で「縦の衝突がなくなるまで横に列を増やす」アルゴリズムで配置。常に矩形が被らないことが幾何学的に保証される。</p>
      </header>

      <div className="p2a2-board">
        <div className="p2a2-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div key={ml.mi} className={"p2a2-tick" + (ml.isYear ? " is-year" : "")} style={{ top: yOfMonth(ml.mi) }}>
              <span className="mono">{ml.label}</span>
            </div>
          ))}
        </div>

        <div className="p2a2-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const pack = packSpans(laneSpans);
            const stripeCols = Math.max(1, pack.cols);
            const stripeW = stripeCols * SUB_W + (stripeCols - 1) * SUB_GAP;
            const stripeAreaW = stripeW + PAD * 2;

            const cardItems = laneSpans.map((s) => ({ id: s.id, top: yOfMonth(monthIndex(s.end)) }));
            const cardPack = packCards(cardItems);
            const cardCols = Math.max(1, cardPack.cols);
            const cardsAreaW = cardCols * CARD_W + (cardCols - 1) * CARD_GAP_X;
            const laneMinW = stripeAreaW + 24 + cardsAreaW + 20;

            return (
              <div key={cat} className="p2a2-lane" style={{ height: totalH, minWidth: laneMinW }}>
                <div className="p2a2-lane-head">
                  <span className="p2a2-lane-label">{cat}</span>
                  <span className="p2a2-lane-badge mono">· {stripeCols} parallel · {cardCols} card cols</span>
                </div>
                <div className="p2a2-lane-body" style={{ height: totalH }}>
                  <svg className="p2a2-leaders" width="100%" height={totalH} preserveAspectRatio="none">
                    {laneSpans.map((s) => {
                      const top = yOfMonth(monthIndex(s.end));
                      const col = pack.assignments.get(s.id) ?? 0;
                      const cCol = cardPack.assignments.get(s.id) ?? 0;
                      const x1 = PAD + col * (SUB_W + SUB_GAP) + SUB_W;
                      const x2 = stripeAreaW + 24 + cCol * (CARD_W + CARD_GAP_X);
                      const y1 = top + 4;
                      const y2 = top + 14;
                      return <path key={s.id} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={s.color} strokeWidth={1.2} fill="none" opacity={0.6} />;
                    })}
                  </svg>

                  {laneSpans.map((s) => {
                    const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
                    const top = yOfMonth(eMi);
                    const h = (eMi - sMi + 1) * pxPerMonth;
                    const col = pack.assignments.get(s.id) ?? 0;
                    return (
                      <div key={s.id} className="p2a2-stripe" style={{ top, height: h, left: PAD + col * (SUB_W + SUB_GAP), width: SUB_W, background: `color-mix(in srgb, ${s.color} 35%, var(--bg))`, borderColor: `color-mix(in srgb, ${s.color} 55%, var(--line))` }}>
                        <div className="p2a2-stripe-cap" style={{ background: `color-mix(in srgb, ${s.color} 70%, var(--ink))` }} />
                      </div>
                    );
                  })}

                  {laneSpans.map((s) => {
                    const top = yOfMonth(monthIndex(s.end));
                    const cCol = cardPack.assignments.get(s.id) ?? 0;
                    const left = stripeAreaW + 24 + cCol * (CARD_W + CARD_GAP_X);
                    return (
                      <div key={s.id} className="p2a2-card" style={{ top, left, width: CARD_W, height: CARD_H, borderLeftColor: `color-mix(in srgb, ${s.color} 65%, var(--line))` }}>
                        <div className="p2a2-card-title serif">{s.title}</div>
                        <div className="p2a2-card-meta mono">{s.start} → {s.end}</div>
                        <div className="p2a2-card-tags">
                          {s.tags.map((t) => <span key={t} className="p2a2-tag mono">{t}</span>)}
                        </div>
                      </div>
                    );
                  })}

                  {lanePoints.map((e) => (
                    <div key={e.id} className="p2a2-point" style={{ top: yOfMonth(monthIndex(e.date)), left: PAD + stripeW / 2 - 5 }}>
                      <span className="p2a2-dot" style={{ background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }} />
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
