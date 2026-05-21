import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P2A — Sub-column Lanes" };

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

// Leftmost non-conflicting column packing per lane.
// Returns map: spanId -> { col, totalCols }
function packSpans(spans: Span[]): { assignments: Map<string, number>; cols: number } {
  // sort by start asc, then end desc (longer first on ties)
  const sorted = [...spans].sort((a, b) => {
    const sa = monthIndex(a.start);
    const sb = monthIndex(b.start);
    if (sa !== sb) return sa - sb;
    return monthIndex(b.end) - monthIndex(a.end);
  });
  const colEnds: number[] = []; // index = column, value = last endMi occupied
  const assignments = new Map<string, number>();
  for (const s of sorted) {
    const startMi = monthIndex(s.start);
    const endMi = monthIndex(s.end);
    let placed = -1;
    for (let c = 0; c < colEnds.length; c++) {
      if (colEnds[c] < startMi) {
        placed = c;
        break;
      }
    }
    if (placed === -1) {
      placed = colEnds.length;
      colEnds.push(endMi);
    } else {
      colEnds[placed] = endMi;
    }
    assignments.set(s.id, placed);
  }
  return { assignments, cols: colEnds.length };
}

export default function Page() {
  const pxPerMonth: number = data.scale.pxPerMonth;
  const months = totalMonths();
  const totalH = months * pxPerMonth;
  const events = data.events as Point[];
  const spans = data.spans as Span[];

  const yOfMonth = (mi: number) => (months - 1 - mi) * pxPerMonth;

  // unique categories preserving order
  const all: (Point | Span)[] = [...spans, ...events];
  const cats: string[] = [];
  for (const it of all) if (!cats.includes(it.category)) cats.push(it.category);

  // year labels
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

  // pre-compute per-lane packing
  const lanePack = new Map<string, { assignments: Map<string, number>; cols: number }>();
  for (const cat of cats) {
    const laneSpans = spans.filter((s) => s.category === cat);
    lanePack.set(cat, packSpans(laneSpans));
  }

  const SUB_COL_W = 16; // px
  const SUB_GAP = 3;
  const LANE_PAD_X = 10;

  return (
    <main className="p2a-wrap">
      <header className="p2a-head">
        <div className="pf-eyebrow">Timeline · Variant P2A</div>
        <h1 className="pf-h1">
          Sub-column <em>Lanes</em>
        </h1>
        <p className="pf-lede">
          各カテゴリレーン内で並行する活動を、左詰めパッキングで細いサブカラムに分割。
          横に読めば月ごとの全体像、レーン内を縦に読めば同時に走っていたスレッドの本数が見える。
        </p>
      </header>

      <div className="p2a-board" style={{ height: totalH + 80 }}>
        {/* gutter */}
        <div className="p2a-gutter" style={{ height: totalH }}>
          {monthLabels.map((ml) => (
            <div
              key={ml.mi}
              className={"p2a-tick" + (ml.isYear ? " is-year" : "")}
              style={{ top: yOfMonth(ml.mi) }}
            >
              <span className="p2a-tick-label mono">{ml.label}</span>
            </div>
          ))}
        </div>

        {/* horizontal year guides + today */}
        <div className="p2a-guides" style={{ height: totalH }}>
          {monthLabels
            .filter((ml) => ml.isYear)
            .map((ml) => (
              <div key={ml.mi} className="p2a-guide" style={{ top: yOfMonth(ml.mi) }} />
            ))}
          <div className="p2a-today" style={{ top: yOfMonth(newestMi) }}>
            <span className="p2a-today-label mono">NEWEST</span>
          </div>
        </div>

        {/* lanes */}
        <div className="p2a-lanes">
          {cats.map((cat) => {
            const pack = lanePack.get(cat)!;
            const laneSpans = spans.filter((s) => s.category === cat);
            const lanePoints = events.filter((e) => e.category === cat);
            const cols = Math.max(1, pack.cols);
            const innerWidth = cols * SUB_COL_W + (cols - 1) * SUB_GAP;
            const laneMinWidth = Math.max(180, innerWidth + LANE_PAD_X * 2 + 140);
            return (
              <div
                key={cat}
                className="p2a-lane"
                style={{ height: totalH, minWidth: laneMinWidth }}
              >
                <div className="p2a-lane-head">
                  <span className="p2a-lane-label">{cat}</span>
                  <span className="p2a-lane-badge mono">
                    · {cols} max parallel
                  </span>
                </div>
                <div className="p2a-lane-body" style={{ height: totalH }}>
                  {/* sub-column background guides */}
                  <div
                    className="p2a-subcols"
                    style={{ width: innerWidth, left: LANE_PAD_X }}
                  >
                    {Array.from({ length: cols }).map((_, i) => (
                      <div
                        key={i}
                        className="p2a-subcol-bg"
                        style={{
                          left: i * (SUB_COL_W + SUB_GAP),
                          width: SUB_COL_W,
                          height: totalH,
                        }}
                      />
                    ))}
                  </div>

                  {laneSpans.map((s) => {
                    const startMi = monthIndex(s.start);
                    const endMi = monthIndex(s.end);
                    const top = yOfMonth(endMi);
                    const height = (endMi - startMi + 1) * pxPerMonth;
                    const col = pack.assignments.get(s.id) ?? 0;
                    const left = LANE_PAD_X + col * (SUB_COL_W + SUB_GAP);
                    return (
                      <div
                        key={s.id}
                        className="p2a-stripe"
                        style={{
                          top,
                          height,
                          left,
                          width: SUB_COL_W,
                          background: `color-mix(in srgb, ${s.color} 35%, var(--bg))`,
                          borderColor: `color-mix(in srgb, ${s.color} 50%, var(--line))`,
                        }}
                        title={`${s.title} (${s.start} → ${s.end})`}
                      >
                        <div
                          className="p2a-stripe-cap"
                          style={{
                            background: `color-mix(in srgb, ${s.color} 65%, var(--ink))`,
                          }}
                        />
                        <div className="p2a-stripe-label serif">{s.title}</div>
                      </div>
                    );
                  })}

                  {/* span detail cards anchored to the right of the sub-columns */}
                  <div
                    className="p2a-stripe-cards"
                    style={{ left: LANE_PAD_X + innerWidth + 10 }}
                  >
                    {laneSpans.map((s) => {
                      const startMi = monthIndex(s.start);
                      const endMi = monthIndex(s.end);
                      const top = yOfMonth(endMi);
                      const height = (endMi - startMi + 1) * pxPerMonth;
                      return (
                        <div
                          key={s.id}
                          className="p2a-card"
                          style={{
                            top,
                            minHeight: Math.min(height, 96),
                            borderLeftColor: `color-mix(in srgb, ${s.color} 60%, var(--line))`,
                          }}
                        >
                          <div className="p2a-card-title serif">{s.title}</div>
                          <div className="p2a-card-meta mono">
                            {s.start} → {s.end}
                          </div>
                          <div className="p2a-card-tags">
                            {s.tags.map((t) => (
                              <span key={t} className="p2a-tag mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* point events at lane center */}
                  {lanePoints.map((e) => {
                    const mi = monthIndex(e.date);
                    const top = yOfMonth(mi);
                    const isNewest = mi === newestMi;
                    const centerLeft = LANE_PAD_X + innerWidth / 2;
                    return (
                      <div
                        key={e.id}
                        className="p2a-point"
                        style={{ top, left: centerLeft }}
                      >
                        <span
                          className={"p2a-dot" + (isNewest ? " is-now" : "")}
                          style={
                            isNewest
                              ? undefined
                              : { background: `color-mix(in srgb, ${e.color} 70%, var(--ink))` }
                          }
                        />
                        <div className="p2a-point-body">
                          <div className="p2a-point-date mono">{e.date}</div>
                          <div className="p2a-point-title serif">{e.title}</div>
                          <div className="p2a-point-summary">{e.summary}</div>
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
