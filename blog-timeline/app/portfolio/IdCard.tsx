'use client';

import { DATA } from './data';

export default function IdCard() {
  const { identity, core } = DATA;

  return (
    <aside className="pf-aside">
      <div className="idc-photo">
        <img src="/avatar.webp" alt="らっく" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
      </div>
      <h1 className="idc-name">Rai <em>Tsumugu</em></h1>
      <div className="idc-kana">ら っ く</div>
      <p className="idc-tagline serif" style={{ whiteSpace: 'pre-line' }}>{identity.tagline}</p>

      <div className="idc-rule" />

      <div className="idc-section-title">Core Interest</div>
      <div className="idc-core">
        <div className="idc-core-label">focus</div>
        <div className="idc-core-val">{core.focus}</div>
        <div className="idc-core-tags">
          {core.tags.map(t => <span key={t} className="idc-pill">{t}</span>)}
        </div>
      </div>

      <div className="idc-rule" />

      <div className="idc-section-title">Handles</div>
      {identity.handles.map(h => (
        <div key={h.svc} className="idc-handle">
          <span className="svc">{h.svc}</span>
          <span className="val">
            {h.url
              ? <a href={h.url} target="_blank" rel="noopener noreferrer">{h.val}</a>
              : h.val}
          </span>
        </div>
      ))}

      <div className="idc-rule" />

      <div className="idc-section-title">Titles</div>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--ink-2)' }}>
        {identity.titles.map((t, i) => (
          <div key={i}>· {t}</div>
        ))}
      </div>

      <div className="idc-rule" />

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
        {'// 本名・所属校・直メールは伏せています'}
      </div>
    </aside>
  );
}
