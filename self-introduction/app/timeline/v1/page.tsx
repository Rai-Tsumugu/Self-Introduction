import data from "../data.json";
import "./style.css";

export const metadata = { title: "Timeline V1 — Classic Gradient" };

type Evt = {
  id: string;
  date: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};

function monthsDiff(a: string, b: string) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (ay - by) * 12 + (am - bm);
}

export default function TimelineV1() {
  const pxPerMonth = data.scale.pxPerMonth;
  const events: Evt[] = [...data.events].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );

  const topPad = 40;
  const positions = events.map((_, i) => {
    if (i === 0) return topPad;
    let y = topPad;
    for (let k = 1; k <= i; k++) {
      y += monthsDiff(events[k - 1].date, events[k].date) * pxPerMonth;
    }
    return y;
  });

  const spineHeight = positions[positions.length - 1] + 80;

  const gradientStops = events
    .map((e, i) => {
      const pct = ((positions[i] - topPad) / (spineHeight - topPad)) * 100;
      return `${e.color} ${pct.toFixed(2)}%`;
    })
    .join(", ");

  return (
    <main className="v1-root">
      <header className="v1-header">
        <h1>Timeline</h1>
        <p>2024.04 — 2025.02</p>
      </header>

      <div className="v1-wrap" style={{ height: spineHeight + topPad }}>
        <div
          className="v1-spine"
          style={{
            top: topPad,
            height: spineHeight - topPad,
            background: `linear-gradient(to bottom, ${gradientStops})`,
          }}
        />

        {events.map((e, i) => {
          const [y, m] = e.date.split("-");
          return (
            <div
              key={e.id}
              className="v1-row"
              style={{ top: positions[i] }}
            >
              <div className="v1-label">
                <span className="v1-year">{y}</span>
                <span className="v1-month">{m}月</span>
              </div>
              <div className="v1-dot" style={{ background: e.color }} />
              <div className="v1-connector" style={{ background: e.color }} />
              <article className="v1-card" style={{ borderLeftColor: e.color }}>
                <div className="v1-cat" style={{ color: e.color }}>
                  {e.category}
                </div>
                <h2 className="v1-title">{e.title}</h2>
                <p className="v1-summary">{e.summary}</p>
                <div className="v1-tags">
                  {e.tags.map((t) => (
                    <span key={t} className="v1-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          );
        })}
      </div>
    </main>
  );
}
