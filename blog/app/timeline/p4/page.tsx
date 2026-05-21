import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P4 — Calendar Tape" };

type PointEvent = {
  id: string;
  kind: "point";
  date: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};

type SpanEvent = {
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

// month math
function ym(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}
function parseYM(s: string): [number, number] {
  const [y, m] = s.split("-").map(Number);
  return [y, m];
}
function monthsBetween(a: string, b: string) {
  const [ay, am] = parseYM(a);
  const [by, bm] = parseYM(b);
  return (by - ay) * 12 + (bm - am);
}
function buildMonths(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = parseYM(from);
  const [ey, em] = parseYM(to);
  while (y < ey || (y === ey && m <= em)) {
    out.push(ym(y, m));
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

// allocate non-conflicting columns to spans (greedy by start)
function allocateColumns(spans: SpanEvent[]): Map<string, number> {
  const sorted = [...spans].sort((a, b) => {
    const sa = monthsBetween("2000-01", a.start);
    const sb = monthsBetween("2000-01", b.start);
    if (sa !== sb) return sa - sb;
    return monthsBetween("2000-01", b.end) - monthsBetween("2000-01", a.end);
  });
  const colEnds: string[] = []; // last end (YM) per column
  const map = new Map<string, number>();
  for (const s of sorted) {
    let placed = false;
    for (let c = 0; c < colEnds.length; c++) {
      if (monthsBetween(colEnds[c], s.start) > 0) {
        colEnds[c] = s.end;
        map.set(s.id, c);
        placed = true;
        break;
      }
    }
    if (!placed) {
      map.set(s.id, colEnds.length);
      colEnds.push(s.end);
    }
  }
  return map;
}

export default function Page() {
  const PX = data.scale.pxPerMonth; // 80
  const RANGE_START = "2024-04";
  const RANGE_END = "2025-02";
  const monthsAsc = buildMonths(RANGE_START, RANGE_END); // oldest -> newest
  const monthsDesc = [...monthsAsc].reverse(); // newest top -> oldest bottom
  const totalMonths = monthsAsc.length;
  const totalHeight = totalMonths * PX;

  const points = data.events as PointEvent[];
  const spans = data.spans as SpanEvent[];
  const spanCols = allocateColumns(spans);
  const numCols = Math.max(...Array.from(spanCols.values())) + 1;

  // For a month (YM), compute its top offset in DESC layout:
  // top = (monthsBetween(monthYM, RANGE_END) ) * PX
  const topOfMonth = (m: string) => monthsBetween(m, RANGE_END) * PX;

  // For a span (start..end), in DESC layout newest at top:
  // top = topOfMonth(end), height = (monthsBetween(start,end)+1) * PX
  const spanGeom = (s: SpanEvent) => {
    const top = topOfMonth(s.end);
    const height = (monthsBetween(s.start, s.end) + 1) * PX;
    return { top, height };
  };

  return (
    <div className="p4-shell">
      <header className="p4-header">
        <div className="pf-eyebrow">Timeline · P4</div>
        <h1 className="pf-h1">
          Calendar <em>Tape</em>
        </h1>
        <p className="pf-lede">
          月ごとのセルが縦に連なるカレンダーテープ。点の出来事と並走する期間を、別レーンで同時に見渡す。
        </p>
      </header>

      <div className="p4-board">
        {/* LEFT: month tape */}
        <div className="p4-tape" style={{ height: totalHeight }}>
          {monthsDesc.map((m) => {
            const [y, mm] = parseYM(m);
            const isYearStart = mm === 1 || m === RANGE_END; // accentuate Jan and top
            return (
              <div
                key={m}
                className={`p4-cell ${isYearStart ? "p4-cell-yr" : ""}`}
                style={{ height: PX }}
              >
                <span className="p4-cell-month mono">
                  {y}.{String(mm).padStart(2, "0")}
                </span>
                {mm === 1 || m === RANGE_END ? (
                  <span className="p4-cell-year serif">{y}</span>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* MIDDLE: span stripes */}
        <div
          className="p4-stripes"
          style={{
            height: totalHeight,
            width: numCols * 14 + (numCols - 1) * 4,
          }}
        >
          {spans.map((s) => {
            const { top, height } = spanGeom(s);
            const col = spanCols.get(s.id) ?? 0;
            return (
              <div
                key={s.id}
                className="p4-stripe"
                style={{
                  top,
                  height,
                  left: col * (14 + 4),
                  background: s.color,
                }}
                title={`${s.title} (${s.start} – ${s.end})`}
              >
                <span className="p4-stripe-label mono">
                  {s.title} · {s.start.slice(2)}–{s.end.slice(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* RIGHT: point event cards + dots */}
        <div className="p4-events" style={{ height: totalHeight }}>
          {points.map((e) => {
            const top = topOfMonth(e.date);
            return (
              <div
                key={e.id}
                className="p4-point-row"
                style={{ top, height: PX }}
              >
                <span
                  className="p4-dot"
                  style={{ background: "var(--accent)" }}
                  aria-hidden
                />
                <div className="p4-card">
                  <div className="p4-card-date mono">{e.date}</div>
                  <div className="p4-card-title serif">{e.title}</div>
                  <div className="p4-card-summary">{e.summary}</div>
                  <div className="p4-card-tags">
                    {e.tags.map((t) => (
                      <span key={t} className="p4-card-tag mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <footer className="p4-legend">
        <div className="p4-legend-title mono">Spans</div>
        <ul className="p4-legend-list">
          {spans.map((s) => (
            <li key={s.id} className="p4-legend-item">
              <span
                className="p4-legend-swatch"
                style={{ background: s.color }}
              />
              <span className="p4-legend-name">{s.title}</span>
              <span className="p4-legend-range mono">
                {s.start} → {s.end}
              </span>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
