import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P3 — Spine & Ribbons" };

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

function ym(s: string) {
  const [y, m] = s.split("-").map(Number);
  return y * 12 + (m - 1);
}

// Months from a reference (RANGE_START)
function monthsFromStart(s: string) {
  return ym(s) - ym(RANGE_START);
}

function monthLabel(s: string) {
  const [, m] = s.split("-").map(Number);
  return `${s.split("-")[0]}.${String(m).padStart(2, "0")}`;
}

// Assign ribbon columns (lanes) so that overlapping spans stack horizontally.
function assignLanes(spans: Span[]) {
  // sort by start asc for lane allocation
  const sorted = [...spans].sort((a, b) => ym(a.start) - ym(b.start));
  const laneEnds: number[] = [];
  const laneOf = new Map<string, number>();
  for (const s of sorted) {
    const start = ym(s.start);
    const end = ym(s.end);
    let placed = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] < start) {
        placed = i;
        break;
      }
    }
    if (placed === -1) {
      placed = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[placed] = end;
    }
    laneOf.set(s.id, placed);
  }
  return { laneOf, laneCount: laneEnds.length };
}

export default function Page() {
  const d = data as { scale: { pxPerMonth: number }; events: Point[]; spans: Span[] };
  const pxPerMonth = d.scale.pxPerMonth;
  const totalMonths = ym(RANGE_END) - ym(RANGE_START) + 1; // 11
  const totalHeight = totalMonths * pxPerMonth;

  // top = newest, bottom = oldest. So a month offset m from RANGE_START
  // should sit at top = (totalMonths - 1 - m) * pxPerMonth
  const topForMonth = (s: string) => (totalMonths - 1 - monthsFromStart(s)) * pxPerMonth;

  // For spans, top edge = top of the END month (newer side), height = (end - start + 1) * pxPerMonth
  const spanGeom = (s: Span) => {
    const startM = monthsFromStart(s.start);
    const endM = monthsFromStart(s.end);
    const top = (totalMonths - 1 - endM) * pxPerMonth;
    const height = (endM - startM + 1) * pxPerMonth;
    return { top, height };
  };

  const { laneOf, laneCount } = assignLanes(d.spans);

  // Split lanes into left / right relative to spine: even lanes left, odd lanes right.
  // Better: split half/half — first half to left, rest right, so density visually balances.
  const leftLanes = Math.ceil(laneCount / 2);
  const laneSide = (lane: number): "left" | "right" => (lane < leftLanes ? "left" : "right");
  const laneOffset = (lane: number) => {
    if (lane < leftLanes) return leftLanes - 1 - lane; // closest to spine has offset 0
    return lane - leftLanes;
  };

  const RIBBON_W = 16;
  const RIBBON_GAP = 4;

  // Month tick labels (every month)
  const months: string[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const total = ym(RANGE_START) + i;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    months.push(`${y}-${String(m).padStart(2, "0")}`);
  }

  return (
    <main className="p3-page">
      <header className="p3-header">
        <div className="pf-eyebrow">Timeline · P3</div>
        <h1 className="pf-h1">
          Spine <em>&amp;</em> Ribbons
        </h1>
        <p className="pf-lede">
          脊椎のような中央軸に点イベントが留まり、活動期間は半透明のリボンとなって軸の両脇を流れる。重なりが濃くなる月は、それだけ忙しかった月。
        </p>
        <div className="p3-legend">
          <span className="p3-legend-item">
            <span className="p3-legend-dot" /> point event
          </span>
          <span className="p3-legend-item">
            <span className="p3-legend-ribbon" /> span (activity)
          </span>
        </div>
      </header>

      <section className="p3-stage" style={{ height: totalHeight + 80 }}>
        {/* month ticks */}
        <div className="p3-ticks" style={{ height: totalHeight }}>
          {months.map((mLabel) => {
            const top = topForMonth(mLabel);
            return (
              <div
                key={mLabel}
                className="p3-tick"
                style={{ top }}
              >
                <span className="p3-tick-label mono">{monthLabel(mLabel)}</span>
                <span className="p3-tick-line" />
              </div>
            );
          })}
        </div>

        {/* spine */}
        <div className="p3-spine" style={{ height: totalHeight }} />

        {/* ribbons */}
        <div className="p3-ribbons" style={{ height: totalHeight }}>
          {d.spans.map((s) => {
            const lane = laneOf.get(s.id) ?? 0;
            const side = laneSide(lane);
            const offset = laneOffset(lane);
            const { top, height } = spanGeom(s);
            const shift = offset * (RIBBON_W + RIBBON_GAP) + 8;
            const style: React.CSSProperties = {
              top,
              height,
              width: RIBBON_W,
              ["--ribbon-color" as string]: s.color,
            };
            if (side === "left") style.right = `calc(50% + ${shift}px)`;
            else style.left = `calc(50% + ${shift}px)`;
            return (
              <div key={s.id} className={`p3-ribbon p3-ribbon-${side}`} style={style}>
                <div className="p3-ribbon-label">
                  <span className="mono p3-ribbon-range">
                    {monthLabel(s.start)}–{monthLabel(s.end)}
                  </span>
                  <span className="p3-ribbon-title serif">{s.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* point events */}
        <div className="p3-points" style={{ height: totalHeight }}>
          {d.events.map((e, i) => {
            const top = topForMonth(e.date);
            const side: "left" | "right" = i % 2 === 0 ? "right" : "left";
            return (
              <div
                key={e.id}
                className={`p3-point p3-point-${side}`}
                style={{ top }}
              >
                <span className="p3-point-dot" />
                <span className="p3-point-connector" />
                <div className="p3-point-card">
                  <div className="p3-point-date mono">{monthLabel(e.date)}</div>
                  <h3 className="p3-point-title serif">{e.title}</h3>
                  <p className="p3-point-summary">{e.summary}</p>
                  <div className="p3-point-tags">
                    {e.tags.map((t) => (
                      <span key={t} className="p3-tag mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
