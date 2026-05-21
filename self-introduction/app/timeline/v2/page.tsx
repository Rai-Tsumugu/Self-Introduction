import data from "../data.json";
import "./style.css";

export const metadata = { title: "Timeline V2 — Minimal Mono" };

type Event = {
  id: string;
  date: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};

function toMonths(d: string): number {
  const [y, m] = d.split("-").map(Number);
  return y * 12 + (m - 1);
}

export default function TimelineV2Page() {
  const pxPerMonth = data.scale.pxPerMonth;
  const events = [...(data.events as Event[])].sort(
    (a, b) => toMonths(b.date) - toMonths(a.date)
  );

  const newest = toMonths(events[0].date);
  const positions = events.map((e) => (newest - toMonths(e.date)) * pxPerMonth);
  const totalHeight = positions[positions.length - 1] + 120;

  return (
    <main className="v2-root">
      <header className="v2-header">
        <h1>Timeline — V2</h1>
        <p>minimal · mono · {events.length} events</p>
      </header>

      <div className="v2-timeline" style={{ height: totalHeight }}>
        <div className="v2-spine" />
        {events.map((e, i) => (
          <article key={e.id} className="v2-event" style={{ top: positions[i] }}>
            <div className="v2-date">{e.date.replace("-", ".")}</div>
            <div className="v2-dot" />
            <div className="v2-content">
              <h2 className="v2-title">{e.title}</h2>
              <p className="v2-summary">{e.summary}</p>
              <div className="v2-meta">
                {[e.category, ...e.tags].join(" · ")}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
