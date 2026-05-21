# 議論ログ: Vercel + Cloudflare DNS 構成の設計

3 エージェント（DevOps / 開発者体験(DX) / セキュリティ）に並列で論点を出させ、その結果を元に最終手順書（`02_deployment_process.md`）を作成した。本ファイルは各エージェントの発言を編集せずに保管したもの。

- 対象リポジトリ: `Self-Introduction`（モノレポ、`self-introduction/` が Next.js App Router アプリ）
- 採用構成: **Vercel にデプロイ + Cloudflare は DNS のみ管理（プロキシ OFF）**
- 議論日: 2026-05-21

---

## Agent A: DevOps / インフラ視点

# Vercel + Cloudflare DNS デプロイ手順

## 1. Vercel アカウント作成 〜 GitHub 連携

1. https://vercel.com/signup にアクセスし「Continue with GitHub」を選択
2. GitHub OAuth 認可画面で `Authorize Vercel` をクリック
3. Vercel ダッシュボードで `Add New...` → `Project` を選択
4. `Import Git Repository` から対象リポジトリの `Import` をクリック（未表示なら `Adjust GitHub App Permissions` でリポジトリを追加）

## 2. モノレポの Root Directory 設定

1. `Configure Project` 画面の `Root Directory` 欄で `Edit` をクリック
2. ディレクトリツリーから `self-introduction` を選択して `Continue`
3. これにより Vercel は `self-introduction/package.json` を起点にビルドする（指定しないと「No Next.js version detected」エラーになる）

## 3. ビルド設定

| 項目 | 値 |
|---|---|
| Framework Preset | `Next.js`（自動検出） |
| Build Command | 空欄（デフォルト `next build`）／pnpm 利用時は `pnpm build` |
| Install Command | 空欄（lockfile から自動: `npm ci` / `pnpm install` / `yarn install`） |
| Output Directory | 空欄（Next.js は `.next` を自動使用、上書き禁止） |
| Node.js Version | `Settings` → `General` → `Node.js Version` で `20.x` 推奨 |

Dockerfile はリポジトリにあっても無視される（Vercel ビルダーが優先）。

## 4. 環境変数の登録

1. `Settings` → `Environment Variables` を開く
2. `Key` / `Value` を入力し、`Environments` で `Production` `Preview` `Development` を選択
3. クライアント参照する値は `NEXT_PUBLIC_` プレフィックスを付与
4. 既存デプロイへ反映するには `Deployments` → 対象 → `...` → `Redeploy`
5. ローカル同期は `vercel env pull .env.local`

## 5. Cloudflare DNS レコード設定

Cloudflare ダッシュボード → 対象ゾーン → `DNS` → `Records` → `Add record`

| Type | Name | Target | Proxy status |
|---|---|---|---|
| CNAME | `@` (apex) | `cname.vercel-dns.com` | **DNS only（グレー雲）** |
| CNAME | `www` | `cname.vercel-dns.com` | **DNS only（グレー雲）** |

- apex に CNAME を貼れるのは Cloudflare の **CNAME Flattening**（無料プランで自動有効）が apex を A レコードへ展開してくれるため
- Proxy を **オレンジ雲（Proxied）にしてはいけない理由**:
  - Vercel の SSL 証明書発行（HTTP-01 / TLS-ALPN）が Cloudflare プロキシで遮断され失敗する
  - Cloudflare と Vercel の二重 CDN になりキャッシュ・ヘッダ衝突、リダイレクトループ、`Too many redirects` が発生
  - 実 IP が Cloudflare の IP に置換され Vercel 側ドメイン検証が通らない
- 既存の A/AAAA/CNAME（旧サーバ向け）は削除しておく

## 6. Vercel に独自ドメイン追加

1. プロジェクト `Settings` → `Domains` → `Add` をクリック
2. apex（例: `example.com`）を入力 → `Add`。続けて `www.example.com` も追加
3. どちらを正にするか聞かれたら apex を Primary、`www` は `Redirect to example.com` を選択（逆も可）
4. Vercel が `Valid Configuration` を表示するまで待機（DNS 伝播後、通常数十秒〜数分）
5. 検証失敗時は `Refresh` をクリック、または `dig example.com +short` で `cname.vercel-dns.com` 系へ解決されるか確認

## 7. SSL 証明書の自動発行

1. ドメイン検証成功と同時に Vercel が Let's Encrypt へ ACME チャレンジを実行
2. 証明書発行後、`Domains` 画面に鍵アイコンと `Valid` が表示される
3. 有効期限 90 日／Vercel が自動更新するため運用作業は不要
4. 強制 HTTPS は標準で有効（HTTP は 308 で HTTPS にリダイレクト）

## 8. デプロイ後 動作確認チェックリスト

- [ ] `https://example.com` と `https://www.example.com` が 200 で表示
- [ ] 一方から他方へ 308 リダイレクトされる
- [ ] `curl -I https://example.com` で `server: Vercel`、`strict-transport-security` ヘッダを確認
- [ ] `openssl s_client -connect example.com:443 -servername example.com </dev/null | openssl x509 -noout -issuer -dates` で Let's Encrypt 発行・期限を確認
- [ ] `dig example.com +short` / `dig www.example.com +short` が `cname.vercel-dns.com` 経由で解決
- [ ] Cloudflare の全レコードがグレー雲（DNS only）
- [ ] Vercel `Deployments` の最新が `Ready`、`Functions` / `Edge` のログにエラーなし
- [ ] 主要ページの動的ルーティング・API Route・画像最適化（`/_next/image`）が動作
- [ ] Lighthouse で Performance / SEO / Best Practices を計測しベースライン記録
- [ ] PR を作成して Preview Deployment URL が自動発行されることを確認

---

## Agent B: 開発者体験(DX) / CI 視点

# Next.js × Vercel × GitHub 開発フロー設計

## 1. ブランチ戦略
- `main`: 本番ブランチ。直接 push 禁止、PR 経由のみマージ可（Branch protection で必須化）。
- `feat/*`, `fix/*`, `docs/*`: 作業ブランチ。1 PR = 1 トピックで小さく保つ。
- `main` へのマージで本番デプロイ、それ以外の push で Preview デプロイが走る。Squash merge を推奨し、履歴を線形に保つ。

## 2. Vercel の Production / Preview 設定
1. Vercel Dashboard → Project → Settings → Git で **Production Branch = `main`** を指定。
2. **Preview Deployments** は「All branches」を有効化（`feat/timeline` 含む全ブランチが対象）。
3. Environment Variables は `Production` / `Preview` / `Development` の 3 スコープを分けて登録し、Preview には本番 DB を絶対に紐付けない。

## 3. PR ごとの自動プレビュー URL
- PR を作成/更新するたびに `https://<project>-<hash>-<team>.vercel.app` 形式の URL が自動発行される。
- コミット単位の URL（不変）と、ブランチ単位の URL（最新を指す Alias）の 2 種が払い出されるので、レビュー依頼にはブランチ Alias、バグ報告には不変 URL を使い分ける。
- デザインレビュー・QA・ステークホルダー確認はすべてこの Preview URL 上で実施し、ローカル環境差異を排除する。

## 4. プレビュー URL の PR 自動コメント
1. Vercel GitHub App をインストール済みなら、デフォルトで Bot が PR にコメント＋ Checks に Deployment Status を投稿する。
2. 表示されない場合は Project Settings → Git → **"Comments on Pull Requests"** と **"Commit Comments"** を ON にする。
3. プレビュー表に Inspect / Visit / 各 Route のリンクが並ぶので、PR テンプレに「Preview URL で確認した項目」のチェックリストを置くと運用が安定する。

## 5. デプロイ失敗時の通知
- Vercel GitHub App は各デプロイを **GitHub Checks** として登録する（`Vercel – Preview` / `Vercel – Production`）。
- `main` ブランチ保護で **"Require status checks to pass" に `Vercel` を含める** と、ビルド失敗 PR はマージ不可になる。
- 加えて Vercel → Settings → Notifications で Slack/Email を Production Failure に絞って配信し、ノイズを抑える。

## 6. `vercel.json` の要否
- Next.js は Vercel がゼロコンフィグで最適化するため、**今回は不要**。
- 必要になるのは「特殊な `rewrites`/`redirects`/`headers` を Git 管理したい」「cron や特定 Region 指定をしたい」場合のみ。Dashboard で済む設定を `vercel.json` に書くと二重管理になるため避ける。
- Cloudflare DNS 側は Vercel 指定の A/CNAME を登録し、**Proxy（オレンジ雲）は OFF**（DNS only）にする。Proxy ON は SSL 二重化や Preview 証明書発行で詰まる。

## 7. `vercel dev` / `vercel pull` の使い所
1. 初回: `vercel link` でローカルとプロジェクトを紐付け。
2. `vercel pull --environment=preview` で Preview 環境変数を `.env.local` に取得（本番値は引かない）。
3. 通常開発は `next dev` で十分高速。**Edge Functions / `rewrites` / Image Optimization の挙動を再現したい時だけ `vercel dev`** を使う。
4. 環境変数を更新したら `vercel pull` を再実行する運用をチームで統一する。

## 8. ロールバック手順
1. Vercel Dashboard → Project → **Deployments** タブを開く。
2. 直前の安定版デプロイ（緑チェック）を選択し、右上 `⋯` → **"Promote to Production"** をクリック。
3. 数秒で本番 Alias が切り替わり、ビルド不要で即時復旧する。
4. 復旧後に `git revert <sha>` で `main` を巻き戻す PR を作成し、コードと本番の状態を一致させる（Promote だけだと Git と乖離するため必須）。
5. 影響範囲を Issue に記録し、Postmortem を残す。

---

## Agent C: セキュリティ / 運用視点

# Vercel + Cloudflare DNS 運用 セキュリティ/運用ガイド

## 1. Cloudflareプロキシ(オレンジ雲) ONの問題点
**リスク**: オレンジ雲ONだとTLSがクライアント↔CF↔Vercelで二重化され、CF側の暗号化モードを"Full(strict)"にしないと中間者リスクや無限リダイレクトが発生する。さらにVercelはACMEチャレンジ(HTTP-01/TLS-ALPN-01)をエッジ直接受信できず、**証明書の自動発行・更新が失敗**する。アクセス元IPはCFのIPになるため、Vercel側のIP allow/deny・レートリミット・ログ分析・bot検知も全て狂う。
**対策**: **DNS only(グレー雲)を基本**とする。Vercelに証明書発行と配信を任せ、Cloudflareは権威DNSのみ担当させる。

## 2. それでもCF側でCDN/WAFを効かせたい場合
- **オレンジ雲 + Full(strict) + Authenticated Origin Pulls**: 設定は可能だが、Vercel側もCDNなのでキャッシュ二重化・パージ不整合・証明書更新失敗が起きやすく**非推奨**。
- **Cloudflare Workers/Pagesへ移管**: WAFを本気で使うならホスティングごと寄せる方が筋が良い。
- 折衷案として、**Vercel Firewall(WAF/Rate Limit/Bot Protection)** をまず使うのが推奨。

## 3. 環境変数管理
**リスク**: Preview/Devの値をProdに混入させると本番DBを壊す。
**対策**: Vercelの環境スコープ(Production / Preview / Development)を**必ず分離**し、DB接続文字列やAPIキーは**Sensitive(Secret)**フラグを立てて読み出し不可にする。`NEXT_PUBLIC_`プレフィックスはクライアントに露出するためシークレットには絶対付けない。ローカルは`.env.local`(gitignore)で扱い、`vercel env pull`で同期する。

## 4. プレビューURLの公開リスク
**リスク**: `*.vercel.app`のPreview URLは推測・SNS流出・検索エンジン収集の対象となり、未リリース機能や本番相当データが漏れる。
**対策**: プロジェクト設定で**Vercel Authentication**(SSO)をPreview全体に強制。外部レビュー用にはPassword Protection(Pro+)。加えて`X-Robots-Tag: noindex`をPreview環境のみ付与。本番DBはPreviewから参照させない。

## 5. DNSSECの有効化
**リスク**: DNSキャッシュポイズニングでトラフィックを攻撃者ドメインへ誘導される。
**対策**: Cloudflareダッシュボードで**DNSSECを有効化**し、レジストラ側にDSレコードを登録。鍵ロールオーバーはCF管理なので運用負荷は低い。

## 6. apexドメインとCNAME flattening
**リスク**: RFC上apexにCNAMEは置けず、Vercelが指定する`cname.vercel-dns.com`を直接設定するとMX等と衝突する。
**対策**: CloudflareはCNAME flatteningで擬似的にCNAME at apexを許容するため、apex(@)に`cname.vercel-dns.com`をCNAME登録すれば自動でA/AAAAに解決される。Aレコード直書き(`76.76.21.21`等)はVercel側IP変更時に死ぬので避ける。

## 7. 最低限のセキュリティヘッダ
HTTPSリダイレクトはVercelが自動付与。`next.config.js`の`headers()`で以下を付与。

```js
async headers() {
  return [{ source: '/:path*', headers: [
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
  ]}];
}
```

securityheaders.com とSSL Labsで**A以上**を確認する。

## 8. バックアウト戦略
**リスク**: 切替直後の障害でDNS TTLが長いと切り戻しに数時間かかる。
**対策**: 切替**1週間前にTTLを300秒**に短縮。VercelはImmutable Deploymentsなので、ダッシュボードから前回Deploymentに**Promote to Production**で即時ロールバック可能。DBマイグレーションは前方互換で行い、Cloudflare DNSも旧レコードを下書き保存しておく。重大障害時はCloudflareでメンテページへの302を即時投入できる体制を作っておく。

---

## 議論サマリー（3 エージェントの合意点）

1. **Cloudflare はグレー雲（DNS only）固定**。プロキシ ON は SSL/CDN/ACME すべてで害が大きい。
2. **モノレポなので Root Directory = `self-introduction` 必須**。Dockerfile は使わない。
3. **`vercel.json` は今回不要**、Dashboard 設定で完結。
4. **環境変数は Production / Preview / Development の 3 スコープを必ず分離**。
5. **ブランチ保護 + Vercel Checks 必須化**で壊れたコードのマージを防ぐ。
6. **ロールバックは Promote to Production**、その後 `git revert` で履歴を合わせる。
7. **TTL 短縮 → 切替 → 検証** の順で安全にカットオーバー。
