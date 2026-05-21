import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P1 — Gantt Lanes" };

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

function monthIndex(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  const [sy, sm] = RANGE_START.split("-").map(Number);
  return (y - sy) * 12 + (m - sm);
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y}.${m}`;
}

export default function TimelineP1() {
  const pxPerMonth = data.scale.pxPerMonth;
  const totalMonths = monthIndex(RANGE_END) + 1; // 11
  const maxIdx = totalMonths - 1; // 10
  const contentHeight = totalMonths * pxPerMonth;

  const events = data.events as Point[];
  const spans = data.spans as Span[];

  // Y coord (top): newest at top. For a month with index i, y = (maxIdx - i) * pxPerMonth.
  const yOfMonth = (ym: string) => (maxIdx - monthIndex(ym)) * pxPerMonth;

  // Build month label rows
  const monthRows: { ym: string; y: number }[] = [];
  for (let i = maxIdx; i >= 0; i--) {
    const y = (maxIdx - i) * pxPerMonth;
    const sy = 2024;
    const sm = 4;
    const totalM = sy * 12 + (sm - 1) + i;
    const yy = Math.floor(totalM / 12);
    const mm = (totalM % 12) + 1;
    const ym = `${yy}-${String(mm).padStart(2, "0")}`;
    monthRows.push({ ym, y });
  }

  // Column packing for spans: leftmost-non-conflicting-column
  type PackedSpan = Span & { col: number; top: number; height: number };
  const sortedSpans = [...spans].sort(
    (a, b) => monthIndex(a.start) - monthIndex(b.start)
  );
  const colEnds: number[] = []; // stores latest endIdx in that column
  const packed: PackedSpan[] = sortedSpans.map((s) => {
    const sIdx = monthIndex(s.start);
    const eIdx = monthIndex(s.end);
    let col = 0;
    while (col < colEnds.length && colEnds[col] >= sIdx) col++;
    colEnds[col] = eIdx;
    const months = eIdx - sIdx + 1;
    // bar Y based on END (newest end at top): top = y(end)
    const top = yOfMonth(s.end);
    const height = months * pxPerMonth;
    return { ...s, col, top, height };
  });

  const numCols = Math.max(1, colEnds.length);
  const COL_WIDTH = 180;
  const COL_GAP = 12;

  return (
    <main className="p1-page">
      <header className="p1-header">
        <div className="pf-eyebrow">Timeline · P1</div>
        <h1 className="pf-h1">
          Gantt <em>Lanes</em>
        </h1>
        <p className="pf-lede">
          点としての出来事と、並走する活動の期間を、ひとつの縦軸で見渡す。
        </p>
      </header>

      <section
        className="p1-stage"
        style={{
          height: `${contentHeight}px`,
          gridTemplateColumns: `140px 24px 1fr`,
        }}
      >
        {/* Month / year gutter */}
        <div className="p1-gutter" style={{ height: contentHeight }}>
          {monthRows.map((r) => (
            <div
              key={r.ym}
              className="p1-month"
              style={{ top: r.y, height: pxPerMonth }}
            >
              <span className="p1-month-ym mono">{formatMonth(r.ym)}</span>
            </div>
          ))}
        </div>

        {/* Spine */}
        <div className="p1-spine-col" style={{ height: contentHeight }}>
          <div className="p1-spine" />
          {events.map((e) => {
            const y = yOfMonth(e.date);
            return (
              <div
                key={e.id}
                className="p1-dot"
                style={{ top: y, background: "var(--accent)" }}
                title={e.title}
              />
            );
          })}
        </div>

        {/* Right: events labels + gantt */}
        <div className="p1-right" style={{ height: contentHeight }}>
          {/* Point event labels (left side of right pane) */}
          <div className="p1-points">
            {events.map((e) => {
              const y = yOfMonth(e.date);
              return (
                <article key={e.id} className="p1-point" style={{ top: y - 8 }}>
                  <div className="p1-point-date mono">{formatMonth(e.date)}</div>
                  <h3 className="p1-point-title serif">{e.title}</h3>
                  <div className="p1-point-cat mono">{e.category}</div>
                  <p className="p1-point-sum">{e.summary}</p>
                </article>
              );
            })}
          </div>

          {/* Gantt lanes */}
          <div
            className="p1-gantt"
            style={{
              width: numCols * COL_WIDTH + (numCols - 1) * COL_GAP,
            }}
          >
            {packed.map((s) => (
              <article
                key={s.id}
                className="p1-bar"
                style={{
                  top: s.top,
                  height: s.height,
                  left: s.col * (COL_WIDTH + COL_GAP),
                  width: COL_WIDTH,
                  // CSS custom prop for tinting
                  ["--bar" as never]: s.color,
                }}
              >
                <div className="p1-bar-edge" />
                <div className="p1-bar-body">
                  <h3 className="p1-bar-title serif">{s.title}</h3>
                  <div className="p1-bar-cat mono">{s.category}</div>
                  <p className="p1-bar-sum">{s.summary}</p>
                </div>
                <div className="p1-bar-dates mono">
                  {formatMonth(s.start)} → {formatMonth(s.end)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
