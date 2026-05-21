import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2C — Primary & Tributary" };

type Point = {
  id: string;
  kind: "point";
  date: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};
type Span = {
  id: string;
  kind: "span";
  start: string;
  end: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};

const RANGE_START = "2024-04";
const RANGE_END = "2025-02";

function ym(s: string): { y: number; m: number } {
  const [y, m] = s.split("-").map(Number);
  return { y, m };
}
function monthIndex(s: string): number {
  const a = ym(RANGE_START);
  const b = ym(s);
  return (b.y - a.y) * 12 + (b.m - a.m);
}
function totalMonths(): number {
  return monthIndex(RANGE_END) + 1;
}

export default function Page() {
  const pxPerMonth: number = data.scale.pxPerMonth;
  const months = totalMonths();
  const totalH = months * pxPerMonth;
  const events = data.events as Point[];
  const spans = data.spans as Span[];

  const yOfMonth = (mi: number) => (months - 1 - mi) * pxPerMonth;

  const all: (Point | Span)[] = [...spans, ...events];
  const cats: string[] = [];
  for (const it of all) if (!cats.includes(it.category)) cats.push(it.category);

  const monthLabels: { mi: number; label: string; isYear: boolean }[] = [];
  const a = ym(RANGE_START);
  for (let i = 0; i < months; i++) {
    const total = a.y * 12 + (a.m - 1) + i;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    monthLabels.push({
      mi: i,
      label: m === 1 || i === 0 ? `${y}.${String(m).padStart(2, "0")}` : String(m).padStart(2, "0"),
      isYear: m === 1,
    });
  }

  const newestMi = Math.max(
    ...events.map((e) => monthIndex(e.date)),
    ...spans.map((s) => monthIndex(s.end))
  );

  // For a given lane, sort spans by duration desc, then start asc, to pick primary.
  function classify(laneSpans: Span[]) {
    if (laneSpans.length === 0) return { primary: null as Span | null, tributaries: [] as Span[] };
    const sorted = [...laneSpans].sort((x, y) => {
      const dx = monthIndex(x.end) - monthIndex(x.start);
      const dy = monthIndex(y.end) - monthIndex(y.start);
      if (dy !== dx) return dy - dx;
      return monthIndex(x.start) - monthIndex(y.start);
    });
    return { primary: sorted[0], tributaries: sorted.slice(1) };
  }

  // Lane visual constants
  const LANE_W = 200; // nominal; SVG uses viewBox 100%
  const CENTER_X = 50; // percent
  const PRIMARY_W = 16;
  const TRIB_W = 9;
  const OFFSET = 20; // % offset for tributary divergence

  return (
    <main className="p2c-wrap">
      <header className="p2c-head">
        <div className="pf-eyebrow">Timeline · Variant P2C</div>
        <h1 className="pf-h1">
          Primary &amp; <em>Tributary</em>
        </h1>
        <p className="pf-lede">
          各レーンの中心を流れる主活動（プライマリ）に、並行して発生した支流（トリビュタリ）が左右へ枝分かれする構成。「川と支流」のメタファーで、メイン活動が続く傍らで現れては消えるサイドプロジェクトを表現する。
        </p>
      </header>

      <div className="p2c-board" style={{ height: totalH + 80 }}>
        <div className="p2c-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div
              key={ml.mi}
              className={"p2c-tick" + (ml.isYear ? " is-year" : "")}
              style={{ top: yOfMonth(ml.mi) }}
            >
              <span className="p2c-tick-label mono">{ml.label}</span>
            </div>
          ))}
        </div>

        <div className="p2c-guides" style={{ height: totalH }}>
          {monthLabels
            .filter((ml) => ml.isYear)
            .map((ml) => (
              <div key={ml.mi} className="p2c-guide" style={{ top: yOfMonth(ml.mi) }} />
            ))}
          <div className="p2c-today" style={{ top: yOfMonth(newestMi) }}>
            <span className="p2c-today-label mono">NEWEST</span>
          </div>
        </div>

        <div className="p2c-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const { primary, tributaries } = classify(laneSpans);

            // assign tributaries alternating left/right, by start order
            const tribsSorted = [...tributaries].sort(
              (x, y) => monthIndex(x.start) - monthIndex(y.start)
            );
            const tribsWithSide = tribsSorted.map((t, i) => ({
              span: t,
              side: i % 2 === 0 ? -1 : 1, // -1 left, +1 right
            }));

            return (
              <div key={cat} className="p2c-lane" style={{ height: totalH + 56 }}>
                <div className="p2c-lane-head">
                  <span className="p2c-lane-label">{cat}</span>
                  {primary && (
                    <span className="p2c-lane-primary mono" title={primary.title}>
                      ▎{primary.title}
                    </span>
                  )}
                </div>
                <div className="p2c-lane-body" style={{ height: totalH }}>
                  {/* SVG river */}
                  <svg
                    className="p2c-river"
                    width="100%"
                    height={totalH}
                    viewBox={`0 0 100 ${totalH}`}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {/* primary stripe */}
                    {primary && (() => {
                      const startMi = monthIndex(primary.start);
                      const endMi = monthIndex(primary.end);
                      const yTop = yOfMonth(endMi);
                      const yBot = yOfMonth(startMi) + pxPerMonth;
                      return (
                        <line
                          x1={CENTER_X}
                          y1={yTop}
                          x2={CENTER_X}
                          y2={yBot}
                          stroke={primary.color}
                          strokeOpacity={0.75}
                          strokeWidth={PRIMARY_W}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })()}

                    {/* tributaries: curved divergence from center → side → back to center */}
                    {tribsWithSide.map(({ span: t, side }) => {
                      const startMi = monthIndex(t.start);
                      const endMi = monthIndex(t.end);
                      const yTop = yOfMonth(endMi);
                      const yBot = yOfMonth(startMi) + pxPerMonth;
                      const offX = CENTER_X + side * OFFSET;
                      // smooth bezier: start at center, curve out to offX, hold, curve back
                      const len = yBot - yTop;
                      const curve = Math.min(len * 0.35, pxPerMonth * 1.2);
                      const d = [
                        `M ${CENTER_X} ${yBot}`,
                        `C ${CENTER_X} ${yBot - curve}, ${offX} ${yBot - curve}, ${offX} ${yBot - curve - 2}`,
                        `L ${offX} ${yTop + curve + 2}`,
                        `C ${offX} ${yTop + curve}, ${CENTER_X} ${yTop + curve}, ${CENTER_X} ${yTop}`,
                      ].join(" ");
                      return (
                        <path
                          key={t.id}
                          d={d}
                          fill="none"
                          stroke={t.color}
                          strokeOpacity={0.55}
                          strokeWidth={TRIB_W}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </svg>

                  {/* Primary label / card */}
                  {primary && (() => {
                    const startMi = monthIndex(primary.start);
                    const endMi = monthIndex(primary.end);
                    const top = yOfMonth(endMi);
                    const height = (endMi - startMi + 1) * pxPerMonth;
                    return (
                      <div
                        className="p2c-primary-card"
                        style={{
                          top,
                          height,
                          borderColor: `color-mix(in srgb, ${primary.color} 50%, var(--line))`,
                          background: `color-mix(in srgb, ${primary.color} 12%, var(--surface))`,
                        }}
                      >
                        <div className="p2c-primary-inner">
                          <div className="p2c-primary-kind mono">PRIMARY</div>
                          <div className="p2c-primary-title serif">{primary.title}</div>
                          <div className="p2c-primary-meta mono">
                            {primary.start} → {primary.end}
                          </div>
                          <div className="p2c-stripe-tags">
                            {primary.tags.map((t) => (
                              <span key={t} className="p2c-tag mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tributary tags + cards anchored at top of tributary span */}
                  {tribsWithSide.map(({ span: t, side }) => {
                    const startMi = monthIndex(t.start);
                    const endMi = monthIndex(t.end);
                    const top = yOfMonth(endMi);
                    return (
                      <div
                        key={t.id}
                        className={"p2c-trib " + (side < 0 ? "is-left" : "is-right")}
                        style={{
                          top,
                          borderColor: `color-mix(in srgb, ${t.color} 45%, var(--line))`,
                        }}
                      >
                        <div className="p2c-trib-tag mono">
                          {t.start} → {t.end}
                        </div>
                        <div className="p2c-trib-title serif">{t.title}</div>
                        <div className="p2c-trib-tags">
                          {t.tags.map((tg) => (
                            <span key={tg} className="p2c-tag mono">
                              {tg}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* point events at lane center */}
                  {lanePoints.map((e) => {
                    const mi = monthIndex(e.date);
                    const top = yOfMonth(mi);
                    const isNewest = mi === newestMi;
                    return (
                      <div key={e.id} className="p2c-point" style={{ top }}>
                        <span
                          className={"p2c-dot" + (isNewest ? " is-now" : "")}
                          style={
                            isNewest
                              ? undefined
                              : { background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }
                          }
                        />
                        <div className="p2c-point-body">
                          <div className="p2c-point-date mono">{e.date}</div>
                          <div className="p2c-point-title serif">{e.title}</div>
                          <div className="p2c-point-summary">{e.summary}</div>
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
    </main>
  );
}
