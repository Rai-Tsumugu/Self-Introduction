import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline V4 — Cyber Terminal" };

type Event = {
  id: string;
  date: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (ay - by) * 12 + (am - bm);
}

export default function TimelineV4Page() {
  const pxPerMonth = data.scale.pxPerMonth;
  const events: Event[] = [...data.events].sort((a, b) => (a.date < b.date ? 1 : -1));

  const newest = events[0].date;
  const oldest = events[events.length - 1].date;
  const totalMonths = monthsBetween(newest, oldest);
  const containerHeight = totalMonths * pxPerMonth + 160;

  return (
    <main className="v4-root">
      <div className="v4-container">
        <header className="v4-header">
          <p className="v4-prompt">
            <span className="v4-user">user@self-intro</span>
            <span className="v4-path">:~/timeline</span>
            <span>$ cat history.log --sort=desc</span>
            <span className="v4-cursor" />
          </p>
          <h1 className="v4-title">// CYBER_TIMELINE.v4</h1>
          <p className="v4-subtitle">
            scale = {pxPerMonth}px/month &nbsp;|&nbsp; entries = {events.length} &nbsp;|&nbsp; span = {totalMonths}mo
          </p>
        </header>

        <div className="v4-timeline" style={{ height: containerHeight }}>
          {events.map((evt, i) => {
            const top = monthsBetween(newest, evt.date) * pxPerMonth;
            const isLast = i === events.length - 1;
            const spineChar = isLast ? "└──" : "├──";
            return (
              <article key={evt.id} className="v4-event" style={{ top }}>
                <div className="v4-date">
                  <span className="v4-bracket">[</span>
                  {evt.date}
                  <span className="v4-bracket">]</span>
                </div>
                <div className="v4-spine">{spineChar}</div>
                <div className="v4-body">
                  <h2
                    className="v4-event-title"
                    style={{
                      color: evt.color,
                      textShadow: `0 0 8px ${evt.color}66, 0 0 2px ${evt.color}`,
                    }}
                  >
                    &gt; {evt.title}
                  </h2>
                  <div className="v4-event-meta">
                    id={evt.id} <span className="v4-cat">--category={evt.category}</span>
                  </div>
                  <p className="v4-summary">{evt.summary}</p>
                  <div className="v4-tags">
                    {evt.tags.map((t) => (
                      <span key={t} className="v4-tag">
                        <span className="v4-flag">--tag=</span>
                        {t.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="v4-footer">
          <p>-- END OF LOG -- &nbsp; [exit code: 0]</p>
        </footer>
      </div>
    </main>
  );
}
