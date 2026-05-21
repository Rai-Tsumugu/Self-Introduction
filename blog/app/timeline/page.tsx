import Link from "next/link";
import "../portfolio/portfolio.css";

const proposals = [
  { slug: "p1", name: "Gantt Lanes", desc: "背骨の右側に縦Gantt。並列スパンは列にパッキングして横並びで表示" },
  { slug: "p2", name: "Swim Lanes", desc: "カテゴリごとの縦レーン。水平に読むと同時期の活動が一目で分かる" },
  { slug: "p3", name: "Spine & Ribbons", desc: "中央背骨 + 半透明リボン。重なる月ほど色が濃く、活動密度を可視化" },
  { slug: "p4", name: "Calendar Tape", desc: "月単位の縦カレンダー + 横並びストライプで並列期間を表現" },
  { slug: "p5", name: "Floating Capsules", desc: "細い背骨 + 期間そのものの形をした浮遊カプセルカード" },
];

const p2Extensions = [
  { slug: "p2a", name: "Sub-column Lanes", desc: "レーン内をサブ列に分割。N max parallelバッジで並列度を明示" },
  { slug: "p2b", name: "Density Stack", desc: "重ね合わせで濃淡が変化。多忙な月ほど色が濃くなる" },
  { slug: "p2c", name: "Primary & Tributary", desc: "本流(最長活動) + 支流(短期並列)。川のメタファー" },
];

const p2aTextSolutions = [
  { slug: "p2a1", name: "Flow Stack", desc: "カードを縦に押し下げ積み。リーダー線で本体に接続" },
  { slug: "p2a2", name: "Multi-Column Callouts", desc: "詳細カードを複数列にパッキング。矩形衝突ゼロを保証" },
  { slug: "p2a3", name: "In-Stripe + Hover Expand", desc: "通常は縦書きラベルのみ。ホバーで詳細をフロート表示" },
  { slug: "p2a4", name: "Numbered Outboard Legend", desc: "本体は番号バッジのみ。詳細は下に通常フローで列挙" },
  { slug: "p2a5", name: "Zigzag Leader Lines", desc: "左右交互の外側カード + 垂直スロット押し下げ" },
];

const variants = [
  { slug: "v1", name: "Classic Gradient" },
  { slug: "v2", name: "Minimal Mono" },
  { slug: "v3", name: "Editorial Magazine" },
  { slug: "v4", name: "Cyber Terminal" },
  { slug: "v5", name: "Card Stack" },
];

export default function TimelineIndex() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px", color: "var(--ink)", background: "var(--bg)", minHeight: "100vh" }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          // timeline design lab
        </div>
        <h1 className="serif" style={{ fontSize: 40, margin: "6px 0 12px", letterSpacing: "-0.01em" }}>
          点 と 並列 を どう 見せるか
        </h1>
        <p className="ink-2" style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 560 }}>
          ピンポイントの日付と、並列して進む活動期間を、既存のサイトデザインを尊重したうえで5案を並列に検討しました。
          スケールは全案共通で <code style={{ fontFamily: "var(--font-mono)" }}>1ヶ月 = 80px</code>、上が最新・下が過去。
        </p>
      </header>

      <section style={{ marginBottom: 48 }}>
        <h2 className="serif" style={{ fontSize: 22, margin: "0 0 16px" }}>提案 (既存デザインに馴染む方向)</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12, margin: 0 }}>
          {proposals.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/timeline/${p.slug}`}
                style={{
                  display: "block",
                  padding: "18px 22px",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: "var(--surface)",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{p.slug.toUpperCase()}</span>
                  <span className="serif" style={{ fontSize: 18, fontWeight: 600 }}>{p.name}</span>
                </div>
                <div className="ink-2" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{p.desc}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="serif" style={{ fontSize: 22, margin: "0 0 6px" }}>P2 拡張案 (レーン内の並列も扱う)</h2>
        <p className="ink-2" style={{ fontSize: 13, margin: "0 0 16px" }}>同じ分野内で複数活動が並走するケースの可視化アプローチ。</p>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12, margin: 0 }}>
          {p2Extensions.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/timeline/${p.slug}`}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: "var(--surface)",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{p.slug.toUpperCase()}</span>
                  <span className="serif" style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                </div>
                <div className="ink-2" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>{p.desc}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="serif" style={{ fontSize: 22, margin: "0 0 6px" }}>P2A テキスト非衝突案 (どんなに並列数が増えても被らない)</h2>
        <p className="ink-2" style={{ fontSize: 13, margin: "0 0 16px" }}>P2A を採用前提で、テキスト重なりを構造的に防ぐ5アプローチ。</p>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12, margin: 0 }}>
          {p2aTextSolutions.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/timeline/${p.slug}`}
                style={{
                  display: "block",
                  padding: "16px 20px",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius)",
                  background: "var(--surface)",
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{p.slug.toUpperCase()}</span>
                  <span className="serif" style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                </div>
                <div className="ink-2" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>{p.desc}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="serif" style={{ fontSize: 18, margin: "0 0 12px", color: "var(--ink-2)" }}>初期バリアント (デザイン探索用)</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: 8, margin: 0 }}>
          {variants.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/timeline/${v.slug}`}
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 13,
                  color: "var(--ink-2)",
                  textDecoration: "none",
                  background: "var(--bg-2)",
                }}
              >
                {v.slug.toUpperCase()} · {v.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
