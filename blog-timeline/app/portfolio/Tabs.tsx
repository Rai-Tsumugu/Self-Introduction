'use client';

import { useState } from 'react';
import { DATA } from './data';

type TabKey = 'profile' | 'awards' | 'works' | 'stack' | 'timeline' | 'now' | 'contact';

const TABS: { k: TabKey; label: string; count?: number }[] = [
  { k: 'profile',  label: 'Profile' },
  { k: 'awards',   label: 'Awards',   count: DATA.awards.length },
  { k: 'works',    label: 'Works',    count: DATA.works.length },
  { k: 'stack',    label: 'Stack' },
  { k: 'timeline', label: 'Timeline' },
  { k: 'now',      label: 'Now' },
  { k: 'contact',  label: 'Contact' },
];

export default function Tabs() {
  const [tab, setTab] = useState<TabKey>('profile');

  const handleTab = (k: TabKey) => {
    setTab(k);
    if (typeof window !== 'undefined') localStorage.setItem('pf.tab', k);
  };

  return (
    <main className="pf-main">
      <nav className="pf-tabbar" role="tablist">
        {TABS.map(t => (
          <button key={t.k} role="tab" aria-selected={tab === t.k}
            className="pf-tab" onClick={() => handleTab(t.k)}>
            {t.label}
            {t.count != null && <span className="pf-tab-count">{t.count}</span>}
          </button>
        ))}
      </nav>
      <div className="pf-panel" role="tabpanel">
        {tab === 'profile'  && <ProfilePanel />}
        {tab === 'awards'   && <AwardsPanel />}
        {tab === 'works'    && <WorksPanel />}
        {tab === 'stack'    && <StackPanel />}
        {tab === 'timeline' && <TimelinePanel />}
        {tab === 'now'      && <NowPanel />}
        {tab === 'contact'  && <ContactPanel />}
      </div>
    </main>
  );
}

function ProfilePanel() {
  const D = DATA;
  return (
    <>
      <div className="pf-eyebrow">01 — Profile</div>
      <h1 className="pf-h1">Hi, I build <em>weird web things</em>.</h1>

      <p className="pf-lede serif">
        きっかけは「自分の行動を記録したい」という、ただそれだけの動機だった。
        高校生のとき、日々の行動・時刻・メモを残すWebアプリを作り始め、
        気づけば3年以上ログが積み上がっていた。
      </p>

      <p className="pf-lede serif">
        そこから派生して気になってきたのが、「プロセスの記録」だ。
        完成物だけが残り、試行錯誤の跡が消えていくことへの違和感。
        デザインでも、コードでも、何かを作るときの思考の流れには価値があるはずなのに、
        いつも結果だけが残る。そのギャップを埋めるために作っているのが{' '}
        <strong>Process Note</strong> で、このアイデアを軸にハッカソンを{DATA.awards.length}件受賞した。
      </p>

      <p className="pf-lede serif">
        作り方のクセとして、まず「自分が使いたいか」で判断する。
        誰かを想定する前に、自分の課題から始まる。
        ツールはすぐ動かして手触りを確かめる派で、設計より先に手を動かすことが多い。
        プロトタイプが動いた瞬間のあの感覚が、いちばん好きだ。
      </p>

      <p className="pf-lede serif">
        いまは Web と VR の境目に興味がある。
        画面の外に出ていく体験と、記録・ログという地味なテーマの組み合わせが、
        自分らしいと思っている。
      </p>

      <div className="pf-eyebrow" style={{ marginTop: 48 }}>Links</div>
      <div className="contact-card" style={{ marginTop: 8 }}>
        <div className="contact-grid">
          {D.identity.handles.filter(h => h.url).map(h => (
            <div key={h.svc} className="contact-row">
              <span className="label">{h.svc}</span>
              <span className="val">
                <a href={h.url!} target="_blank" rel="noopener noreferrer">{h.val}</a>
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AwardsPanel() {
  const D = DATA;
  const years = [...new Set(D.awards.map(a => a.date.split('.')[0]))].sort();
  const yearRange = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : years[0];
  return (
    <>
      <div className="pf-eyebrow">02 — Awards · {D.awards.length} wins ({yearRange})</div>
      <h1 className="pf-h1">Lately, I&apos;ve been <em>winning things</em>.</h1>
      <p className="pf-lede serif">
        プロトタイピング系ハッカソンを計{D.awards.length}件受賞しました。
      </p>
      <div style={{ marginTop: 32 }}>
        {D.awards.map((a, i) => (
          <div key={i} className="award">
            <div className="award-date">{a.date}</div>
            <div>
              <div className="award-title">{a.title}</div>
              <div className="award-meta">🏆 {a.meta}</div>
              <div className="award-summary">{a.summary}</div>
              <div className="award-project">project: {a.project}</div>
            </div>
            <div className="award-trophy">{a.major ? '★' : '·'}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function WorksPanel() {
  return (
    <>
      <div className="pf-eyebrow">03 — Works · via GitHub</div>
      <h1 className="pf-h1">Things I&apos;ve <em>shipped</em>.</h1>
      <p className="pf-lede serif">
        デプロイ先がある作品はその場でライブプレビュー。▶ ボタンで実際に触れます。
      </p>
      <div className="work-grid" style={{ marginTop: 16 }}>
        {DATA.works.map(w => <WorkCard key={w.repo} w={w} />)}
      </div>
    </>
  );
}

function WorkCard({ w }: { w: typeof DATA.works[number] }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <article className="work">
      <div className="work-preview">
        {w.live ? (
          <>
            <iframe src={w.live} loading="lazy" title={w.name}
              onLoad={() => setLoaded(true)}
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity .3s' }} />
            {!loaded && <div className="work-preview-empty">loading preview…</div>}
            <span className="work-live-badge">LIVE</span>
          </>
        ) : (
          <div className="work-preview-empty">no live deploy · repo only</div>
        )}
        {'featured' in w && w.featured && <span className="work-featured">FEATURED</span>}
      </div>
      <div className="work-body">
        <div className="work-repo">{w.repo}</div>
        <h3 className="work-name serif">{w.name}</h3>
        <p className="work-desc">{w.desc}</p>
        <div className="work-tags">{w.tags.map(t => <span key={t} className="work-tag">{t}</span>)}</div>
        <div className="work-actions">
          {w.live && (
            <a className="btn btn-primary" href={w.live} target="_blank" rel="noopener noreferrer">
              ▶ 実際に触る
            </a>
          )}
          <a className="btn" href={`https://github.com/${w.repo}`} target="_blank" rel="noopener noreferrer">
            &lt;/&gt; Code
          </a>
        </div>
      </div>
    </article>
  );
}

function StackPanel() {
  const D = DATA;
  return (
    <>
      <div className="pf-eyebrow">04 — Stack</div>
      <h1 className="pf-h1">What I <em>reach for</em>.</h1>
      <div className="stack-grid" style={{ marginTop: 32 }}>
        <div className="stack-card">
          <h3>Languages</h3>
          {D.languages.map(l => (
            <div key={l.name} className="stack-lang">
              <span className="name">{l.name}</span>
              <span className="role">{l.role}</span>
              <span className="head">{l.headline}</span>
            </div>
          ))}
        </div>
        <div className="stack-card">
          <h3>Frameworks</h3>
          {D.frameworks.map(f => (
            <div key={f.name} className="stack-lang">
              <span className="name">{f.name}</span>
              <span className="role">·</span>
              <span className="head">{f.note}</span>
            </div>
          ))}
        </div>
        <div className="stack-card">
          <h3>Daily AI</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {D.ai.daily.map(a => <span key={a} className="work-tag">{a}</span>)}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            構想段階で対話により気づきを広げるアシスタント群を普段使い。
          </p>
        </div>
        <div className="stack-card">
          <h3>Coding AI</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {D.ai.coding.map(a => <span key={`c-${a}`} className="work-tag">{a}</span>)}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Codex / Gemini / Copilot で補完・リファクタを回しながらコードを書く。
          </p>
        </div>
      </div>

      <div className="pf-eyebrow" style={{ marginTop: 48 }}>Devices</div>
      <div className="dev-grid" style={{ marginTop: 16 }}>
        {D.pcs.map(p => (
          <div key={p.kind} className="dev">
            <div className="dev-kind">{p.kind}</div>
            <div className="dev-spec">
              {p.specs.map(([l, v]) => (
                <span key={l} style={{ display: 'contents' }}>
                  <span className="label">{l}</span>
                  <span>{v}</span>
                </span>
              ))}
            </div>
            <div className="dev-note">{p.note}</div>
          </div>
        ))}
      </div>
    </>
  );
}

const MONTH_PX = 56;

function parseTLDate(s: string): { y: number; m: number; d: number } {
  const parts = s.split('.');
  const y = parseInt(parts[0], 10);
  const m = parts[1] && /^\d+$/.test(parts[1]) ? parseInt(parts[1], 10) : 4;
  const d = parts[2] && /^\d+$/.test(parts[2]) ? parseInt(parts[2], 10) : 1;
  return { y, m, d };
}

function monthIdx(p: { y: number; m: number }) {
  return p.y * 12 + (p.m - 1);
}

function positionPx(p: { y: number; m: number; d: number }, baseMI: number) {
  const daysInMonth = new Date(p.y, p.m, 0).getDate();
  return (monthIdx(p) - baseMI + (p.d - 1) / daysInMonth) * MONTH_PX;
}

function fmtMD(p: { m: number; d: number }) {
  return `${p.m}月${p.d}日`;
}

function TimelinePanel() {
  const parsed = DATA.timeline.map(e => ({
    ...e,
    _s: parseTLDate(e.date),
    _e: e.endDate ? parseTLDate(e.endDate) : null,
  }));

  const allMI = parsed.flatMap(e => [monthIdx(e._s), e._e ? monthIdx(e._e) : monthIdx(e._s)]);
  const minMI = Math.min(...allMI);
  const maxMI = Math.max(...allMI);
  const totalMonths = maxMI - minMI + 2;
  const totalHeight = totalMonths * MONTH_PX;

  const months: { y: number; m: number; top: number }[] = [];
  for (let i = 0; i < totalMonths; i++) {
    const mi = minMI + i;
    months.push({ y: Math.floor(mi / 12), m: (mi % 12) + 1, top: i * MONTH_PX });
  }

  const events = [...parsed].sort((a, b) => {
    const da = monthIdx(a._s) + a._s.d / 31;
    const db = monthIdx(b._s) + b._s.d / 31;
    return da - db;
  });

  return (
    <>
      <div className="pf-eyebrow">05 — Timeline</div>
      <h1 className="pf-h1">A short <em>log</em>.</h1>
      <p className="pf-lede serif">記録好きゆえ、自分の活動年表も残しておきます。</p>
      <div className="tl2" style={{ height: totalHeight + 40, marginTop: 32 }}>
        <div className="tl2-band">
          {months.map((mo, i) => (
            <div
              key={i}
              className="tl2-month"
              data-q={Math.floor((mo.m - 1) / 3)}
              style={{ top: mo.top, height: MONTH_PX }}
            >
              {(mo.m === 1 || mo.m === 4 || mo.m === 7 || mo.m === 10) && (
                <span className="tl2-month-label">{mo.m}月</span>
              )}
              {mo.m === 4 && <span className="tl2-year-label">{mo.y}年度</span>}
            </div>
          ))}
        </div>
        <div className="tl2-events">
          {events.map((e, i) => {
            const top = positionPx(e._s, minMI);
            const endTop = e._e ? positionPx(e._e, minMI) : null;
            const isPeriod = endTop != null;
            return (
              <div
                key={i}
                className={`tl2-event${e.major ? ' major' : ''}${isPeriod ? ' period' : ''}`}
                style={{ top }}
              >
                {isPeriod && (
                  <div className="tl2-bar" style={{ height: Math.max(endTop! - top, 4) }} />
                )}
                <div className="tl2-date">
                  {fmtMD(e._s)}
                  {isPeriod && `〜${fmtMD(e._e!)}`}
                </div>
                <div className="tl2-line" />
                <div className="tl2-content">
                  <div className="tl2-title">{e.title}</div>
                  {e.desc && <div className="tl2-desc">{e.desc}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function NowPanel() {
  return (
    <>
      <div className="pf-eyebrow">06 — Now</div>
      <h1 className="pf-h1">Currently <em>in progress</em>.</h1>
      <p className="pf-lede serif">今やっていることの snapshot。</p>
      <div style={{ marginTop: 32 }}>
        {DATA.now.map((n, i) => (
          <div key={i} className="now-card">
            <div className="now-status">{n.status}</div>
            <h3>{n.title}</h3>
            <p style={{ color: 'var(--ink-2)', margin: 0 }}>{n.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ContactPanel() {
  return (
    <>
      <div className="pf-eyebrow">07 — Contact</div>
      <h1 className="pf-h1">Say <em>hi</em>.</h1>
      <p className="pf-lede serif">
        ネットリテラシー配慮のため、直接のメール・電話番号は公開していません。
        下記の手段でゆるっとどうぞ。
      </p>
      <div className="contact-card">
        <div className="contact-grid">
          <div className="contact-row">
            <span className="label">Handle</span>
            <span className="val">らっく / Rai Tsumugu</span>
          </div>
          <div className="contact-row">
            <span className="label">GitHub</span>
            <span className="val">
              <a href="https://github.com/Rai-Tsumugu" target="_blank" rel="noopener noreferrer">
                github.com/Rai-Tsumugu
              </a>
            </span>
          </div>
          <div className="contact-row">
            <span className="label">Email</span>
            <span className="val" style={{ color: 'var(--ink-3)' }}>{'<フォーム経由のみ公開>'}</span>
          </div>
          <div className="contact-row">
            <span className="label">Location</span>
            <span className="val">北海道 · JP</span>
          </div>
        </div>
      </div>
    </>
  );
}
