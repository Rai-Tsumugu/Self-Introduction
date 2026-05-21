import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2A-1 — Flow Stack" };

type Point = { id: string; kind: "point"; date: string; title: string; category: string; tags: string[]; summary: string; color: string };
type Span = { id: string; kind: "span"; start: string; end: string; title: string; category: string; tags: string[]; summary: string; color: string };

const RANGE_START = "2024-04";
const RANGE_END = "2025-02";

function ym(s: string) { const [y, m] = s.split("-").map(Number); return { y, m }; }
function monthIndex(s: string) { const a = ym(RANGE_START); const b = ym(s); return (b.y - a.y) * 12 + (b.m - a.m); }
function totalMonths() { return monthIndex(RANGE_END) + 1; }

function packSpans(spans: Span[]) {
  const sorted = [...spans].sort((a, b) => monthIndex(a.start) - monthIndex(b.start) || monthIndex(b.end) - monthIndex(a.end));
  const colEnds: number[] = [];
  const assignments = new Map<string, number>();
  for (const s of sorted) {
    const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
    let placed = colEnds.findIndex((e) => e < sMi);
    if (placed === -1) { placed = colEnds.length; colEnds.push(eMi); } else { colEnds[placed] = eMi; }
    assignments.set(s.id, placed);
  }
  return { assignments, cols: colEnds.length };
}

const CARD_H = 78;
const CARD_GAP = 8;

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

  const SUB_W = 14, SUB_GAP = 3, PAD = 10;

  return (
    <main className="p2a1-wrap">
      <header className="p2a1-head">
        <div className="pf-eyebrow">Timeline · Variant P2A-1</div>
        <h1 className="pf-h1">Flow <em>Stack</em></h1>
        <p className="pf-lede">詳細カードを span 開始位置にスナップしつつ、衝突したら下方向に押し下げる縦フロー積み。リーダー線で本体に対応。テキスト衝突は構造的にゼロ。</p>
      </header>

      <div className="p2a1-board">
        <div className="p2a1-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div key={ml.mi} className={"p2a1-tick" + (ml.isYear ? " is-year" : "")} style={{ top: yOfMonth(ml.mi) }}>
              <span className="mono">{ml.label}</span>
            </div>
          ))}
        </div>

        <div className="p2a1-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const pack = packSpans(laneSpans);
            const cols = Math.max(1, pack.cols);
            const stripeW = cols * SUB_W + (cols - 1) * SUB_GAP;
            const stripeAreaW = stripeW + PAD * 2;

            const cardsSorted = [...laneSpans].sort((a, b) => monthIndex(b.end) - monthIndex(a.end));
            let prevBottom = -CARD_GAP;
            const cardTops = new Map<string, number>();
            for (const s of cardsSorted) {
              const ideal = yOfMonth(monthIndex(s.end));
              const top = Math.max(ideal, prevBottom + CARD_GAP);
              cardTops.set(s.id, top);
              prevBottom = top + CARD_H;
            }
            const laneH = Math.max(totalH, prevBottom + 20);

            return (
              <div key={cat} className="p2a1-lane" style={{ height: laneH }}>
                <div className="p2a1-lane-head">
                  <span className="p2a1-lane-label">{cat}</span>
                  <span className="p2a1-lane-badge mono">· {cols} parallel</span>
                </div>
                <div className="p2a1-lane-body" style={{ height: laneH }}>
                  <svg className="p2a1-leaders" width="100%" height={laneH} preserveAspectRatio="none">
                    {laneSpans.map((s) => {
                      const top = yOfMonth(monthIndex(s.end));
                      const col = pack.assignments.get(s.id) ?? 0;
                      const x1 = PAD + col * (SUB_W + SUB_GAP) + SUB_W;
                      const x2 = stripeAreaW + 6;
                      const y1 = top + 6;
                      const y2 = (cardTops.get(s.id) ?? top) + 14;
                      const mx = (x1 + x2) / 2;
                      return <path key={s.id} d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`} stroke={s.color} strokeWidth={1.2} fill="none" strokeDasharray="3 3" opacity={0.55} />;
                    })}
                  </svg>

                  {laneSpans.map((s) => {
                    const sMi = monthIndex(s.start), eMi = monthIndex(s.end);
                    const top = yOfMonth(eMi);
                    const h = (eMi - sMi + 1) * pxPerMonth;
                    const col = pack.assignments.get(s.id) ?? 0;
                    return (
                      <div key={s.id} className="p2a1-stripe" style={{ top, height: h, left: PAD + col * (SUB_W + SUB_GAP), width: SUB_W, background: `color-mix(in srgb, ${s.color} 35%, var(--bg))`, borderColor: `color-mix(in srgb, ${s.color} 55%, var(--line))` }}>
                        <div className="p2a1-stripe-cap" style={{ background: `color-mix(in srgb, ${s.color} 70%, var(--ink))` }} />
                      </div>
                    );
                  })}

                  {laneSpans.map((s) => {
                    const top = cardTops.get(s.id) ?? 0;
                    return (
                      <div key={s.id} className="p2a1-card" style={{ top, left: stripeAreaW + 12, borderLeftColor: `color-mix(in srgb, ${s.color} 65%, var(--line))` }}>
                        <div className="p2a1-card-title serif">{s.title}</div>
                        <div className="p2a1-card-meta mono">{s.start} → {s.end}</div>
                        <div className="p2a1-card-tags">
                          {s.tags.map((t) => <span key={t} className="p2a1-tag mono">{t}</span>)}
                        </div>
                      </div>
                    );
                  })}

                  {lanePoints.map((e) => (
                    <div key={e.id} className="p2a1-point" style={{ top: yOfMonth(monthIndex(e.date)), left: PAD + stripeW / 2 - 5 }}>
                      <span className="p2a1-dot" style={{ background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }} />
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
