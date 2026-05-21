import data from "../data.json";
import "./style.css";

export const metadata = { title: "Timeline V5 — Card Stack" };

type Evt = {
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

function formatDate(d: string): string {
  const [y, m] = d.split("-").map(Number);
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[m - 1]} ${y}`;
}

export default function TimelineV5() {
  const pxPerMonth = data.scale.pxPerMonth;
  const events = ([...data.events] as Evt[]).sort(
    (a, b) => toMonths(b.date) - toMonths(a.date)
  );

  const newest = toMonths(events[0].date);
  const oldest = toMonths(events[events.length - 1].date);
  const totalHeight = (newest - oldest) * pxPerMonth + 220;

  return (
    <div className="v5-wrap">
      <div className="v5-container">
        <div className="v5-header">
          <h1>Timeline</h1>
          <p>Card Stack — Notion-inspired view</p>
        </div>
        <div className="v5-timeline" style={{ height: totalHeight, position: "relative" }}>
          <div className="v5-spine" />
          {events.map((e) => {
            const top = (newest - toMonths(e.date)) * pxPerMonth;
            return (
              <div key={e.id} className="v5-row" style={{ top }}>
                <div className="v5-date-col">
                  <span className="v5-date-pill">{formatDate(e.date)}</span>
                </div>
                <span className="v5-dot" style={{ background: e.color }} />
                <div className="v5-card">
                  <div className="v5-title">{e.title}</div>
                  <div className="v5-category">{e.category}</div>
                  <p className="v5-summary">{e.summary}</p>
                  <div className="v5-tags">
                    {e.tags.map((t) => (
                      <span key={t} className="v5-tag">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
