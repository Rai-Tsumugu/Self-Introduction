# Self-Introduction デプロイ手順書（Vercel + Cloudflare DNS）

3 エージェント（DevOps / DX / セキュリティ）の議論結果（→ `01_discussion_log.md`）を統合した実行用手順。**上から順に実施**すれば本番公開まで到達する。

- リポジトリ: `Self-Introduction`（モノレポ、Next.js App Router アプリは `self-introduction/`）
- ホスティング: **Vercel (Hobby プラン想定)**
- DNS: **Cloudflare（DNS only モード固定、プロキシは使用しない）**
- 想定所要時間: 約 30〜60 分（DNS 伝播待ち含む）

---

## Phase 0: 事前準備

| # | 項目 | 内容 |
|---|---|---|
| 0-1 | GitHub | 対象リポジトリが GitHub にあり、`main` ブランチが存在すること |
| 0-2 | Vercel アカウント | 未作成なら https://vercel.com/signup で「Continue with GitHub」 |
| 0-3 | Cloudflare | 対象ドメインのゾーンが Cloudflare 管理下にあること |
| 0-4 | DNS TTL の短縮 | 切替前日までに既存レコードの TTL を **300 秒** に下げておく（切戻しを高速化するため） |
| 0-5 | 旧ホスティングの確認 | apex / `www` に紐付く既存の A / AAAA / CNAME を控え、切替後に削除予定として把握 |

---

## Phase 1: Vercel プロジェクトの作成

1. Vercel ダッシュボード → **Add New → Project**
2. **Import Git Repository** で `Self-Introduction` を選択
   - 表示されない場合は `Adjust GitHub App Permissions` で公開許可
3. **Configure Project** 画面:
   - **Root Directory**: `self-introduction` に変更（モノレポなので必須。指定しないと「No Next.js version detected」エラー）
   - **Framework Preset**: `Next.js`（自動判定されることを確認）
   - **Build / Install / Output**: すべて空欄でよい（Next.js のデフォルトに任せる）
4. **Deploy** をクリック → 初回ビルドが走り、`*.vercel.app` の URL が払い出されることを確認

### 1-a: プロジェクト設定の追記

- **Settings → General → Node.js Version**: `20.x` を選択
- **Settings → Git → Production Branch**: `main`
- **Settings → Git → Preview Deployments**: `All branches` を有効化
- **Settings → Git → Comments on Pull Requests / Commit Comments**: 両方 ON（PR に Preview URL が自動コメントされる）

---

## Phase 2: 環境変数の登録

1. **Settings → Environment Variables**
2. 各変数を `Production` / `Preview` / `Development` の 3 スコープに分けて登録
3. シークレット系は **Sensitive** フラグを立てる（ダッシュボードから読み出し不可になる）
4. クライアントへ露出してよいものだけ `NEXT_PUBLIC_` プレフィックスを付与（**シークレットには絶対付けない**）
5. ローカル取得: `npx vercel link` → `npx vercel env pull .env.local`（`.env.local` は `.gitignore` 済みであること）

---

## Phase 3: セキュリティヘッダの実装

`self-introduction/next.config.ts` に `headers()` を追加。

```ts
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }];
}
```

CSP は構築物の依存関係（外部フォント・解析ツール等）を見てから別途追加する。

---

## Phase 4: Cloudflare DNS レコードの設定

Cloudflare ダッシュボード → 対象ゾーン → **DNS → Records → Add record**

| Type | Name | Target | TTL | Proxy status |
|---|---|---|---|---|
| CNAME | `@` (apex) | `cname.vercel-dns.com` | Auto | **DNS only（グレー雲）** |
| CNAME | `www` | `cname.vercel-dns.com` | Auto | **DNS only（グレー雲）** |

### 厳守事項

- **オレンジ雲（Proxied）にしない**。理由:
  - Vercel の Let's Encrypt 証明書発行（ACME チャレンジ）が遮断され失敗する
  - Vercel と Cloudflare の二重 CDN になり、キャッシュ衝突・無限リダイレクトが発生
  - クライアント IP が Cloudflare の IP に置換され、Vercel 側のレートリミット・ログ・bot 対策が機能しない
- 既存の A / AAAA / 旧 CNAME は **このタイミングで削除**
- A レコード直書き（`76.76.21.21` 等）は Vercel 側 IP 変更で壊れるため **使わない**（CNAME flattening に任せる）

### DNSSEC

**DNS → Settings → DNSSEC** を有効化し、表示された DS レコードを **レジストラ側** に登録する。

---

## Phase 5: Vercel に独自ドメインを追加

1. プロジェクト **Settings → Domains → Add**
2. apex（例: `example.com`）を追加
3. `www.example.com` も追加し、**apex を Primary、www は Redirect** に設定
4. Vercel が `Valid Configuration` になるまで待機（DNS 伝播後、通常数十秒〜数分）
5. うまく検証が通らない場合:
   - `dig example.com +short` で `cname.vercel-dns.com` 系へ解決されているか確認
   - Cloudflare 側がグレー雲か再確認
   - `Refresh` ボタンを押す

---

## Phase 6: SSL 発行と HTTPS 強制

1. ドメイン検証が通ると **Vercel が自動で Let's Encrypt 証明書を発行**（手動操作不要）
2. `Domains` 画面に鍵アイコン + `Valid` 表示で完了
3. HTTP → HTTPS の 308 リダイレクトは Vercel 側で自動有効
4. 有効期限は 90 日、自動更新されるため運用作業なし

---

## Phase 7: GitHub 側のブランチ保護

1. GitHub → リポジトリ **Settings → Branches → Branch protection rules → Add rule**
2. **Branch name pattern**: `main`
3. 以下にチェック:
   - Require a pull request before merging
   - Require status checks to pass before merging → 検索欄で `Vercel` を追加（`Vercel – Production` / `Vercel – Preview`）
   - Require branches to be up to date before merging
4. マージ方式は **Squash and merge** に統一すると履歴が線形で読みやすい

---

## Phase 8: 動作確認チェックリスト

### 機能・SSL
- [ ] `https://example.com` / `https://www.example.com` が 200 で表示
- [ ] `www` → apex（または逆）に 308 リダイレクト
- [ ] `curl -I https://example.com` で `server: Vercel`、`strict-transport-security` ヘッダを確認
- [ ] `openssl s_client -connect example.com:443 -servername example.com </dev/null | openssl x509 -noout -issuer -dates` で Let's Encrypt 発行・期限を確認

### DNS
- [ ] `dig example.com +short` / `dig www.example.com +short` が `cname.vercel-dns.com` 経由で解決
- [ ] Cloudflare 上の全レコードが **DNS only（グレー雲）**
- [ ] DNSSEC が `Active`、レジストラに DS レコード登録済み

### Next.js
- [ ] 主要ページの動的ルーティング・画像最適化（`/_next/image`）が動作
- [ ] Lighthouse で Performance / SEO / Best Practices を計測し、初期値を記録
- [ ] securityheaders.com / SSL Labs で **A 以上**

### 開発フロー
- [ ] 適当な PR を作って **Preview Deployment URL が自動コメント**される
- [ ] 失敗ビルドが GitHub Checks で **Vercel** として赤くなり、マージブロックされる

---

## Phase 9: 運用 Runbook

### 通常運用
- `main` への PR マージで本番自動デプロイ
- それ以外のブランチ push で Preview 自動デプロイ → PR にコメント
- 環境変数の変更は Dashboard で実施し、必要に応じて `Redeploy`

### ロールバック（本番異常時）
1. Vercel Dashboard → Project → **Deployments**
2. 直前の安定デプロイの `⋯` → **Promote to Production** をクリック（数秒で復旧）
3. その後 `git revert <sha>` を含む PR を作成して `main` を巻き戻し、コードと本番の状態を一致させる
4. Postmortem を Issue に記録

### 緊急停止
- Cloudflare DNS で apex/www の CNAME をメンテページへ向け直す（例: 静的 R2/別ホストへの CNAME）
- 復旧後に Vercel へ戻す

---

## 付録: なぜ Cloudflare プロキシを使わないのか（要点）

| 観点 | プロキシ ON 時の問題 | DNS only での挙動 |
|---|---|---|
| SSL | Vercel の ACME チャレンジが遮断され証明書発行失敗 | Vercel が Let's Encrypt を自動発行・更新 |
| CDN | Vercel と二重キャッシュ、整合性が崩れる | Vercel Edge Network のみで一元化 |
| クライアント IP | Cloudflare IP に置換され、レート制御・ログが破綻 | 実クライアント IP が Vercel まで到達 |
| WAF | Cloudflare WAF を使うため Pro 以上が必要、運用複雑化 | 必要なら **Vercel Firewall** で代替 |

**結論**: 本構成では Cloudflare は **権威 DNS と DNSSEC** のみを担当させ、配信は Vercel に完全に任せる。
