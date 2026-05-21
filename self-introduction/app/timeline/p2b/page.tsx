import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2B — Density Stack" };

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

  // Newest on top: invert Y.
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

  // For each lane: compute per-month concurrency count (spans only)
  const concurrencyByCat: Record<string, number[]> = {};
  let maxConcurrency = 1;
  for (const cat of cats) {
    const arr = new Array(months).fill(0);
    for (const s of spans.filter((x) => x.category === cat)) {
      const a0 = monthIndex(s.start);
      const b0 = monthIndex(s.end);
      for (let i = a0; i <= b0; i++) arr[i] += 1;
    }
    concurrencyByCat[cat] = arr;
    for (const v of arr) if (v > maxConcurrency) maxConcurrency = v;
  }

  return (
    <main className="p2b-wrap">
      <header className="p2b-head">
        <div className="pf-eyebrow">Timeline · Variant P2B</div>
        <h1 className="pf-h1">
          Density <em>Stack</em>
        </h1>
        <p className="pf-lede">
          同一レーン内で並走している複数の活動を、中央の半透明ストライプとして重ねて描画。重なった月ほど色が濃く沈み、忙しさが視覚的に立ち上がる構成。
        </p>
      </header>

      <div className="p2b-board" style={{ height: totalH + 80 }}>
        <div className="p2b-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div
              key={ml.mi}
              className={"p2b-tick" + (ml.isYear ? " is-year" : "")}
              style={{ top: yOfMonth(ml.mi) }}
            >
              <span className="p2b-tick-label mono">{ml.label}</span>
            </div>
          ))}
        </div>

        <div className="p2b-guides" style={{ height: totalH }}>
          {monthLabels
            .filter((ml) => ml.isYear)
            .map((ml) => (
              <div key={ml.mi} className="p2b-guide" style={{ top: yOfMonth(ml.mi) }} />
            ))}
          <div className="p2b-today" style={{ top: yOfMonth(newestMi) }}>
            <span className="p2b-today-label mono">NEWEST</span>
          </div>
        </div>

        <div className="p2b-lanes">
          {cats.map((cat) => {
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const conc = concurrencyByCat[cat];

            // Stagger labels: when two spans start within < 28px on Y, offset alternate ones rightward
            const startsSorted = [...laneSpans].sort(
              (a, b) => monthIndex(b.end) - monthIndex(a.end)
            ); // top-first
            const startLabelOffset = new Map<string, number>();
            const endLabelOffset = new Map<string, number>();
            const seenStartY: number[] = [];
            const seenEndY: number[] = [];
            for (const s of startsSorted) {
              const yStart = yOfMonth(monthIndex(s.end)); // top of stripe (newest end)
              const yEnd = yOfMonth(monthIndex(s.start) - 1); // bottom approx
              let so = 0;
              while (seenStartY.some((y) => Math.abs(y - yStart) < 18 + so * 0)) {
                so += 1;
                if (so > 3) break;
                if (!seenStartY.some((y) => Math.abs(y - (yStart + so * 14)) < 18)) break;
              }
              startLabelOffset.set(s.id, so);
              seenStartY.push(yStart + so * 14);

              let eo = 0;
              while (seenEndY.some((y) => Math.abs(y - yEnd) < 18)) {
                eo += 1;
                if (eo > 3) break;
                if (!seenEndY.some((y) => Math.abs(y - (yEnd + eo * 14)) < 18)) break;
              }
              endLabelOffset.set(s.id, eo);
              seenEndY.push(yEnd + eo * 14);
            }

            return (
              <div key={cat} className="p2b-lane" style={{ height: totalH }}>
                <div className="p2b-lane-head">
                  <span className="p2b-lane-label">{cat}</span>
                  <span className="p2b-lane-count mono">
                    {laneSpans.length + lanePoints.length}
                  </span>
                </div>
                <div className="p2b-lane-body" style={{ height: totalH }}>
                  {/* concurrency indicators on left edge */}
                  <div className="p2b-conc-col">
                    {conc.map((n, mi) => {
                      if (n === 0) return null;
                      const top = yOfMonth(mi) + pxPerMonth / 2;
                      const w = Math.min(1, n / Math.max(2, maxConcurrency)) * 22;
                      return (
                        <div key={mi} className="p2b-conc-row" style={{ top }}>
                          <span className="p2b-conc-num mono">{n}</span>
                          <span
                            className="p2b-conc-bar"
                            style={{ width: w, opacity: 0.3 + n * 0.18 }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* center band — stripes stacked with blend */}
                  <div className="p2b-band">
                    {laneSpans.map((s) => {
                      const startMi = monthIndex(s.start);
                      const endMi = monthIndex(s.end);
                      const top = yOfMonth(endMi);
                      const height = (endMi - startMi + 1) * pxPerMonth;
                      return (
                        <div
                          key={s.id}
                          className="p2b-stripe"
                          style={{
                            top,
                            height,
                            background: s.color,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* labels on the right margin */}
                  <div className="p2b-labels">
                    {laneSpans.map((s) => {
                      const startMi = monthIndex(s.start);
                      const endMi = monthIndex(s.end);
                      const yTop = yOfMonth(endMi);
                      const yBot = yOfMonth(startMi - 1);
                      const soff = (startLabelOffset.get(s.id) || 0) * 14;
                      const eoff = (endLabelOffset.get(s.id) || 0) * 14;
                      return (
                        <div key={s.id} className="p2b-label-group">
                          <div
                            className="p2b-label p2b-label-start"
                            style={{ top: yTop + soff }}
                          >
                            <span
                              className="p2b-label-connector"
                              style={{ background: s.color }}
                            />
                            <span className="p2b-label-title serif">{s.title}</span>
                            <span className="p2b-label-meta mono">
                              {s.start}–{s.end}
                            </span>
                          </div>
                          <div
                            className="p2b-label p2b-label-end"
                            style={{ top: yBot + eoff }}
                            aria-hidden="true"
                          >
                            <span
                              className="p2b-label-tick"
                              style={{ background: s.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* point events: center dot + label */}
                  {lanePoints.map((e) => {
                    const mi = monthIndex(e.date);
                    const top = yOfMonth(mi) + pxPerMonth / 2;
                    const isNewest = mi === newestMi;
                    return (
                      <div key={e.id} className="p2b-point" style={{ top }}>
                        <span className={"p2b-dot" + (isNewest ? " is-now" : "")} />
                        <div className="p2b-point-body">
                          <div className="p2b-point-date mono">{e.date}</div>
                          <div className="p2b-point-title serif">{e.title}</div>
                          <div className="p2b-point-summary">{e.summary}</div>
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
