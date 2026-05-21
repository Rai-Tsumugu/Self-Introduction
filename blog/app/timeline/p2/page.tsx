import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2 — Swim Lanes" };

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

  // Newest on top: invert Y. Y(top) of a given month index i = (months - 1 - i) * pxPerMonth.
  const yOfMonth = (mi: number) => (months - 1 - mi) * pxPerMonth;

  // unique categories preserving order: spans + events
  const all: (Point | Span)[] = [...spans, ...events];
  const cats: string[] = [];
  for (const it of all) if (!cats.includes(it.category)) cats.push(it.category);

  // year labels (year boundaries)
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

  // newest event/span end for "today" marker
  const newestMi = Math.max(
    ...events.map((e) => monthIndex(e.date)),
    ...spans.map((s) => monthIndex(s.end))
  );

  return (
    <main className="p2-wrap">
      <header className="p2-head">
        <div className="pf-eyebrow">Timeline · Variant P2</div>
        <h1 className="pf-h1">
          Swim <em>Lanes</em>
        </h1>
        <p className="pf-lede">
          カテゴリごとに縦のレーンを分け、同じ高さを横に読むとその月に並行していた活動が一望できる構成。
        </p>
      </header>

      <div className="p2-board" style={{ height: totalH + 80 }}>
        {/* gutter: month/year labels + horizontal guides across full board */}
        <div className="p2-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div
              key={ml.mi}
              className={"p2-tick" + (ml.isYear ? " is-year" : "")}
              style={{ top: yOfMonth(ml.mi) }}
            >
              <span className="p2-tick-label mono">{ml.label}</span>
            </div>
          ))}
        </div>

        {/* horizontal year guides */}
        <div className="p2-guides" style={{ height: totalH }}>
          {monthLabels
            .filter((ml) => ml.isYear)
            .map((ml) => (
              <div key={ml.mi} className="p2-guide" style={{ top: yOfMonth(ml.mi) }} />
            ))}
          {/* today marker */}
          <div className="p2-today" style={{ top: yOfMonth(newestMi) }}>
            <span className="p2-today-label mono">NEWEST</span>
          </div>
        </div>

        {/* lanes */}
        <div className="p2-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            return (
              <div key={cat} className="p2-lane" style={{ height: totalH }}>
                <div className="p2-lane-head">
                  <span className="p2-lane-label">{cat}</span>
                </div>
                <div className="p2-lane-body" style={{ height: totalH }}>
                  {laneSpans.map((s) => {
                    const startMi = monthIndex(s.start);
                    const endMi = monthIndex(s.end);
                    const top = yOfMonth(endMi);
                    const height = (endMi - startMi + 1) * pxPerMonth;
                    return (
                      <div
                        key={s.id}
                        className="p2-stripe"
                        style={{
                          top,
                          height,
                          // mix raw color heavily with --bg for warm desaturated look
                          background: `color-mix(in srgb, ${s.color} 30%, var(--bg))`,
                          borderColor: `color-mix(in srgb, ${s.color} 45%, var(--line))`,
                        }}
                      >
                        <div className="p2-stripe-inner">
                          <div className="p2-stripe-title serif">{s.title}</div>
                          <div className="p2-stripe-meta mono">
                            {s.start} → {s.end}
                          </div>
                          <div className="p2-stripe-tags">
                            {s.tags.map((t) => (
                              <span key={t} className="p2-tag mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {lanePoints.map((e) => {
                    const mi = monthIndex(e.date);
                    const top = yOfMonth(mi);
                    const isNewest = mi === newestMi;
                    return (
                      <div key={e.id} className="p2-point" style={{ top }}>
                        <span
                          className={"p2-dot" + (isNewest ? " is-now" : "")}
                          style={
                            isNewest
                              ? undefined
                              : { background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }
                          }
                        />
                        <div className="p2-point-body">
                          <div className="p2-point-date mono">{e.date}</div>
                          <div className="p2-point-title serif">{e.title}</div>
                          <div className="p2-point-summary">{e.summary}</div>
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
