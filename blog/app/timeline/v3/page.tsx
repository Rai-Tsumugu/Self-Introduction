import "./style.css";
import data from "../data.json";

export const metadata = { title: "Timeline V3 — Editorial Magazine" };

type Event = {
  id: string;
  date: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  color: string;
};

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function parseYM(d: string): { y: number; m: number } {
  const [y, m] = d.split("-").map(Number);
  return { y, m };
}

function monthsBetween(a: string, b: string): number {
  const A = parseYM(a);
  const B = parseYM(b);
  return (A.y - B.y) * 12 + (A.m - B.m);
}

export default function TimelineV3Page() {
  const events = [...(data.events as Event[])].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  );
  const pxPerMonth = data.scale.pxPerMonth;

  let prevYear: number | null = null;

  return (
    <main className="v3-root">
      <div className="v3-container">
        <header className="v3-masthead">
          <h1>An Editorial Timeline</h1>
          <span className="v3-issue">Vol. III · 2024–2025</span>
        </header>

        <div style={{ position: "relative" }}>
          <div className="v3-rule" />

          {events.map((ev, i) => {
            const { y, m } = parseYM(ev.date);
            const gapMonths =
              i === 0 ? 0 : monthsBetween(events[i - 1].date, ev.date);
            const marginTop = i === 0 ? 0 : gapMonths * pxPerMonth;
            const showYear = prevYear !== y;
            prevYear = y;
            const indent = i % 3 === 1; // subtle editorial indent

            const dateLong = new Date(y, m - 1, 1).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            });

            return (
              <div key={ev.id} style={{ marginTop }}>
                {showYear && (
                  <>
                    <div className="v3-year-marker">{y}</div>
                    <hr className="v3-year-rule" />
                  </>
                )}
                <article
                  className={`v3-event${indent ? " v3-indent" : ""}`}
                >
                  <span className="v3-month">
                    {String(m).padStart(2, "0")} · {MONTH_NAMES[m - 1]}
                  </span>
                  <p className="v3-date">— {dateLong}</p>
                  <h2 className="v3-title">{ev.title}</h2>
                  <span
                    className="v3-underline"
                    style={{ background: ev.color }}
                  />
                  <p className="v3-summary">{ev.summary}</p>
                  <div className="v3-tags">
                    <span>{ev.category}</span>
                    {ev.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
