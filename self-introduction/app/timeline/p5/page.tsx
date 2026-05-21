import "../../portfolio/portfolio.css";
import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline P5 — Floating Capsules" };

const RANGE_START = "2024-04";
const RANGE_END = "2025-02";

function ym(s: string) {
  const [y, m] = s.split("-").map(Number);
  return y * 12 + (m - 1);
}

// Months from RANGE_END (top = newest)
function monthsFromTop(s: string) {
  return ym(RANGE_END) - ym(s);
}

const PX = data.scale.pxPerMonth;
const TOTAL_MONTHS = ym(RANGE_END) - ym(RANGE_START); // 10
const TIMELINE_HEIGHT = (TOTAL_MONTHS + 1) * PX; // +1 month padding bottom

const SPINE_LEFT = 200;
const CAPSULE_LEFT = 230;
const COL_WIDTH = 210;
const COL_GAP = 16;
const CAPSULE_WIDTH = COL_WIDTH;

type Span = (typeof data.spans)[number];

// Column allocation: leftmost non-conflicting
function allocateColumns(spans: Span[]) {
  // Sort by start (oldest start first to make stable layout)
  const sorted = [...spans].sort((a, b) => ym(a.start) - ym(b.start));
  const cols: { end: number }[] = []; // each col tracks latest end (in month index)
  const mapping = new Map<string, number>();
  for (const s of sorted) {
    const start = ym(s.start);
    const end = ym(s.end);
    let placed = -1;
    for (let i = 0; i < cols.length; i++) {
      if (cols[i].end < start) {
        cols[i].end = end;
        placed = i;
        break;
      }
    }
    if (placed === -1) {
      cols.push({ end });
      placed = cols.length - 1;
    }
    mapping.set(s.id, placed);
  }
  return mapping;
}

function fmtRange(start: string, end: string) {
  return `${start} → ${end}`;
}

export default function P5Page() {
  const colMap = allocateColumns(data.spans as Span[]);

  // Month grid labels
  const monthLabels: { label: string; top: number }[] = [];
  for (let i = 0; i <= TOTAL_MONTHS; i++) {
    const monthIdx = ym(RANGE_END) - i;
    const y = Math.floor(monthIdx / 12);
    const m = (monthIdx % 12) + 1;
    monthLabels.push({
      label: `${y}-${String(m).padStart(2, "0")}`,
      top: i * PX,
    });
  }

  return (
    <main className="p5-main">
      <header className="p5-header">
        <div className="pf-eyebrow">Timeline / P5</div>
        <h1 className="pf-h1">
          Floating <em>Capsules</em>
        </h1>
        <p className="pf-lede">
          中央のスパインに点在するイベントと、右側にフロートする
          カプセル状の期間カード。並走する活動が隣接する「集中の列」として現れる。
        </p>
      </header>

      <div
        className="p5-stage"
        style={{ height: `${TIMELINE_HEIGHT}px` }}
      >
        {/* Month gridlines */}
        {monthLabels.map((ml) => (
          <div
            key={ml.label}
            className="p5-monthrow"
            style={{ top: `${ml.top}px` }}
          >
            <span className="p5-monthlabel mono">{ml.label}</span>
          </div>
        ))}

        {/* Spine */}
        <div
          className="p5-spine"
          style={{ left: `${SPINE_LEFT}px`, height: `${TIMELINE_HEIGHT}px` }}
        />

        {/* Point events */}
        {data.events.map((e, idx) => {
          const top = monthsFromTop(e.date) * PX;
          const side = idx % 2 === 0 ? "left" : "right";
          return (
            <div
              key={e.id}
              className={`p5-point p5-point-${side}`}
              style={{ top: `${top}px`, left: `${SPINE_LEFT}px` }}
            >
              <span className="p5-dot" />
              <div className="p5-point-content">
                <div className="p5-point-date mono">{e.date}</div>
                <div className="p5-point-title serif">{e.title}</div>
                <div className="p5-point-summary">{e.summary}</div>
                <div className="p5-point-tags">
                  {e.tags.map((t) => (
                    <span key={t} className="p5-tag mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Span capsules */}
        {(data.spans as Span[]).map((s) => {
          const col = colMap.get(s.id) ?? 0;
          const topY = monthsFromTop(s.end) * PX;
          const bottomY = monthsFromTop(s.start) * PX;
          const height = bottomY - topY + PX; // include start month thickness
          const left = CAPSULE_LEFT + col * (COL_WIDTH + COL_GAP);
          return (
            <article
              key={s.id}
              className="p5-capsule"
              style={{
                top: `${topY}px`,
                left: `${left}px`,
                width: `${CAPSULE_WIDTH}px`,
                height: `${height}px`,
                borderRadius: `${CAPSULE_WIDTH / 2}px`,
              }}
            >
              <span
                className="p5-capsule-edge"
                style={{ background: s.color, opacity: 0.75 }}
              />
              <div className="p5-capsule-inner">
                <div className="p5-capsule-cat mono">{s.category}</div>
                <h3 className="p5-capsule-title serif">{s.title}</h3>
                <div className="p5-capsule-range mono">
                  {fmtRange(s.start, s.end)}
                </div>
                <p className="p5-capsule-summary">{s.summary}</p>
                <div className="p5-capsule-tags">
                  {s.tags.map((t) => (
                    <span key={t} className="p5-tag mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
