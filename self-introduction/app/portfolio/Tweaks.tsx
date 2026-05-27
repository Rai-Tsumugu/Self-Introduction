'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

const ACCENTS = {
  red:    { light: ['#c4452d', '#e5a89a', '#fbefe9'], dark: ['#e86849', '#b3543e', '#2a1a14'] },
  blue:   { light: ['#2563eb', '#93c5fd', '#eff6ff'], dark: ['#60a5fa', '#3b82f6', '#172554'] },
  green:  { light: ['#0f766e', '#5eead4', '#ecfdf5'], dark: ['#34d399', '#10b981', '#064e3b'] },
  purple: { light: ['#7c3aed', '#c4b5fd', '#f5f3ff'], dark: ['#a78bfa', '#8b5cf6', '#2e1065'] },
} as const;

type AccentKey = keyof typeof ACCENTS;

interface TweakVals {
  theme: 'light' | 'dark';
  fontScale: number;
  accentHue: AccentKey;
}

const DEFAULTS: TweakVals = { theme: 'light', fontScale: 1, accentHue: 'red' };
const subscribeMounted = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

function readStoredVals(): TweakVals {
  if (typeof window === 'undefined') return DEFAULTS;

  try {
    const stored = JSON.parse(localStorage.getItem('pf.tweaks') || '{}');
    return { ...DEFAULTS, ...stored };
  } catch {
    return DEFAULTS;
  }
}

export default function Tweaks() {
  const [vals, setVals] = useState<TweakVals>(readStoredVals);
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('pf.tweaks', JSON.stringify(vals));
    const root = document.documentElement;
    root.dataset.theme = vals.theme;
    root.style.setProperty('--fs-scale', String(vals.fontScale));
    const pair = ACCENTS[vals.accentHue] ?? ACCENTS.red;
    const [a, a2, abg] = vals.theme === 'dark' ? pair.dark : pair.light;
    root.style.setProperty('--accent', a);
    root.style.setProperty('--accent-2', a2);
    root.style.setProperty('--accent-bg', abg);
  }, [vals, mounted]);

  const change = (patch: Partial<TweakVals>) => setVals(v => ({ ...v, ...patch }));

  if (!mounted) return null;

  return (
    <div className="tw-wrap">
      <button className="tw-fab" onClick={() => setOpen(o => !o)} aria-label="表示設定">
        {open ? '✕' : '⚙'}
      </button>
      {open && (
        <div className="tw">
          <div className="tw-title">表示設定</div>

          <div className="tw-row">
            <div className="tw-label">Theme</div>
            <div className="tw-toggle">
              <button className={vals.theme === 'light' ? 'active' : ''} onClick={() => change({ theme: 'light' })}>☀ light</button>
              <button className={vals.theme === 'dark'  ? 'active' : ''} onClick={() => change({ theme: 'dark'  })}>☾ dark</button>
            </div>
          </div>

          <div className="tw-row">
            <div className="tw-label">Accent</div>
            <div className="tw-swatch-row">
              {(Object.entries(ACCENTS) as [AccentKey, typeof ACCENTS[AccentKey]][]).map(([k, v]) => (
                <button key={k} className={`tw-swatch${vals.accentHue === k ? ' active' : ''}`}
                  style={{ background: v.light[0] }}
                  onClick={() => change({ accentHue: k })} />
              ))}
            </div>
          </div>

          <div className="tw-row">
            <div className="tw-label">Font size · {(vals.fontScale * 100).toFixed(0)}%</div>
            <input type="range" min="0.85" max="1.25" step="0.05"
              value={vals.fontScale}
              onChange={e => change({ fontScale: +e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}
