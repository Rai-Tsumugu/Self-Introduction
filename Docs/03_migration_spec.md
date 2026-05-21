# 移行仕様書 (Agent 実行用)

現環境（ローカル `docker-compose` による Next.js 起動）から、本番構成（Vercel + Cloudflare DNS only + GitHub 連携）へ移行するための、**Agent (Claude Code) 実行用の手順仕様書**。

- 対象: `Self-Introduction` リポジトリ
- 前提構成図:
  - **現状**: GitHub リポジトリ → 開発者ローカルで `docker compose up` → `localhost:3000`
  - **目標**: GitHub `main` push → Vercel 自動ビルド → `https://<独自ドメイン>` (Cloudflare DNS)
- 関連ドキュメント: `01_discussion_log.md` / `02_deployment_process.md`

---

## 0. 凡例: 担当区分

各ステップに以下のいずれかのタグを付ける。Agent はこれを**厳密に守る**こと。

| タグ | 意味 | Agent の振る舞い |
|---|---|---|
| `[AGENT]` | Agent が完全に自動実行できる | ユーザー確認なしで実行可（破壊的でない場合）。Git 操作はユーザー承認後。 |
| `[AGENT:確認後]` | Agent が実行するが、実行前にユーザーへ要約提示と承認取得 | 必ず `AskUserQuestion` などで承認を得る |
| `[MANUAL]` | **人間が UI 操作で行う**。Agent は代行不可 | Agent は手順テキストを提示し、完了を待ってから次へ進む |
| `[VERIFY]` | Agent が検証コマンドを実行し、結果を報告 | コマンド出力を要約してユーザーに報告 |

### Agent が代行できない理由 (MANUAL の根拠)

- Vercel / Cloudflare / GitHub Web UI へのログインは **ブラウザ認証（OAuth / MFA / パスキー）** が必要
- アカウント作成・課金プラン同意・OAuth スコープ承認は **本人意思の確認** が必要
- レジストラ画面 (お名前.com 等) はサイトごとに UI が異なり自動化対象外
- これらは **CLI トークンがあれば一部代行可能** (後述「拡張: 完全自動化モード」参照)

---

## 1. 全体フロー

```
[Phase A] 事前棚卸し         → AGENT 中心
[Phase B] 移行前のコード整備   → AGENT 中心
[Phase C] Vercel セットアップ → MANUAL 中心
[Phase D] DNS 切替           → MANUAL + VERIFY
[Phase E] 切替後検証          → VERIFY 中心
[Phase F] 旧環境クリーンアップ → AGENT:確認後
```

---

## Phase A: 事前棚卸し

### A-1 `[AGENT]` 現状確認

以下を並列実行し、結果をユーザーに 1 メッセージで要約報告する。

```bash
git status
git branch --show-current
git branch -r                                # リモートブランチ一覧 ← main の有無を必ず確認
git remote -v
ls self-introduction/
cat self-introduction/package.json | head -40
cat docker-compose.yml
test -f self-introduction/.env && echo "env exists" || echo "no env"
test -f self-introduction/.env.local && echo "env.local exists" || echo "none"
test -f self-introduction/vercel.json && echo "vercel.json exists" || echo "none"
```

> **📌 ハマりやすい点 (2026-05-21 初回実行時に検知)**:
> ローカルに `main` ブランチが存在しても、**リモートに push されていない**ケースがある（`git branch -r` に `origin/main` が出ない）。この状態で `gh pr create --base main` を実行すると `Base ref must be a branch` で失敗するため、**先に `git push origin main` を実施**してから PR を作成する。Vercel の Production Branch 設定も `main` がリモートにある前提で動く。

### A-2 `[AGENT:確認後]` 移行対象ドメイン名のヒアリング

`AskUserQuestion` で以下を取得する。

- 独自ドメイン (例: `example.com`)
- apex を Primary とするか、`www` を Primary とするか
- 既存ドメインで稼働中の旧サービスがあるか（あるならダウンタイム許容時間も確認）
- Cloudflare アカウントの管理者本人かどうか（DNS 編集権限の有無）

取得した値は **以降の全コマンド・ドキュメントで変数 `${DOMAIN}` `${PRIMARY}` として一貫使用** する。

### A-3 `[AGENT]` `.gitignore` の安全確認

```bash
grep -E "^\.env(\.local)?$" .gitignore self-introduction/.gitignore 2>/dev/null
```

`.env*` が ignore されていない場合は **`[AGENT:確認後]`** で `.gitignore` 追記 PR を提案する。

---

## Phase B: 移行前のコード整備

### B-1 `[AGENT:確認後]` セキュリティヘッダの追加

対象ファイル: `self-introduction/next.config.ts`

差分案を提示してユーザー承認を得てから Edit する。

```ts
const nextConfig = {
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
  },
};
```

### B-2 `[AGENT]` ローカルビルド検証

Vercel と同条件で通ることを事前に確認する。失敗したらここで止め、ユーザーに報告。

```bash
cd self-introduction && npm ci && npm run build
```

### B-3 `[AGENT:確認後]` ブランチ作成 & コミット

- 作業ブランチ例: `chore/vercel-migration`
- コミットメッセージは Conventional Commits + 日本語本文 (`~/.claude/CLAUDE.md` 準拠)
- `git add` は **個別ファイル指定** (`git add -A` 禁止)

### B-4 `[AGENT:確認後]` PR 作成

`gh pr create` で PR を作成。**この時点ではマージしない** (Vercel プロジェクト作成後に Preview URL を確認してからマージする)。

---

## Phase C: Vercel セットアップ

### C-1 `[MANUAL]` Vercel アカウント + GitHub 連携

Agent はユーザーに以下のテキストを提示する。

> 1. https://vercel.com/signup を開く
> 2. **Continue with GitHub** をクリック
> 3. GitHub の OAuth 認可画面で `Authorize Vercel` をクリック
> 4. Vercel ダッシュボードが開いたら次に進んでください

完了を `AskUserQuestion` で確認。

### C-2 `[MANUAL]` プロジェクト作成

> 1. Vercel ダッシュボード → **Add New → Project**
> 2. `Self-Introduction` リポジトリの `Import` をクリック
> 3. **Root Directory** を `self-introduction` に変更（重要: モノレポのため）
> 4. **Framework Preset** が `Next.js` になっていることを確認
> 5. **Build / Install / Output** は空欄のまま
> 6. **Deploy** をクリックして初回ビルド完了を待つ

完了確認時に **発行された `*.vercel.app` URL** を Agent に共有してもらう。

### C-3 `[MANUAL]` プロジェクト設定の追記

> Vercel Dashboard → Project → Settings:
> - **General → Node.js Version**: `20.x`
> - **Git → Production Branch**: `main`
> - **Git → Preview Deployments**: `All branches` を有効化
> - **Git → Comments on Pull Requests / Commit Comments**: 両方 ON

### C-4 `[MANUAL]` 環境変数の登録

現状 `docker-compose.yml` で渡している環境変数は `NODE_ENV: production` のみ。**Vercel では NODE_ENV は自動設定されるため登録不要**。アプリ独自の環境変数がある場合のみ:

> Settings → Environment Variables で `Production / Preview / Development` を分けて登録。シークレットは Sensitive フラグを立てる。

Agent はアプリのコードを `grep -rE "process\.env\." self-introduction/app self-introduction/lib 2>/dev/null` で走査し、登録漏れ候補をユーザーに提示すること（`[AGENT]`）。

### C-5 `[MANUAL]` 独自ドメインの登録 (Vercel 側)

> 1. Settings → Domains → **Add** で `${DOMAIN}` を入力
> 2. 続けて `www.${DOMAIN}` も追加
> 3. Primary は `${PRIMARY}`、もう一方は Redirect に設定
> 4. この時点では「Invalid Configuration」と表示されるが正常 (DNS 未設定のため)
> 5. Vercel が要求する CNAME ターゲット (`cname.vercel-dns.com`) と検証用 TXT (もしあれば) を Agent に共有してください

---

## Phase D: DNS 切替

### D-1 `[AGENT]` 現行 DNS の事前記録

```bash
dig ${DOMAIN} +short
dig www.${DOMAIN} +short
dig ${DOMAIN} TXT +short
dig ${DOMAIN} MX +short
```

結果を **ロールバック用の記録**として `Docs/dns-snapshot-$(date +%Y%m%d).txt` に保存する（`[AGENT:確認後]`）。

### D-2 `[MANUAL]` Cloudflare で TTL を短縮 (切替前夜推奨)

> Cloudflare ダッシュボード → DNS → Records:
> 既存の `${DOMAIN}` / `www.${DOMAIN}` レコードを編集し、**TTL を `300` 秒 (5 min)** に変更。
> ※ Proxy が ON の場合 Auto 表示になるが、切替時にどのみち OFF にするためここでは TTL のみ調整。

### D-3 `[MANUAL]` Cloudflare で DNS レコードを切替

> Cloudflare ダッシュボード → DNS → Records:
> 1. 既存の apex / www 向け A / AAAA / CNAME を **削除** (記録は D-1 に保存済み)
> 2. 以下 2 件を追加:
>
> | Type | Name | Target | Proxy |
> |---|---|---|---|
> | CNAME | `@` | `cname.vercel-dns.com` | **DNS only (グレー雲)** |
> | CNAME | `www` | `cname.vercel-dns.com` | **DNS only (グレー雲)** |
>
> ⚠ **絶対にオレンジ雲 (Proxied) にしない**。ACME 失敗・二重 CDN・実 IP 喪失の原因。

### D-4 `[VERIFY]` DNS 伝播確認

```bash
dig ${DOMAIN} +short
dig www.${DOMAIN} +short
# 期待: cname.vercel-dns.com を経由した A レコードが返る
```

Cloudflare の権威 DNS にも直接問い合わせて確認:

```bash
dig @1.1.1.1 ${DOMAIN} +short
```

5 分待っても伝播しない場合はユーザーに状況を報告し、Cloudflare 側のレコードを再確認してもらう。

### D-5 `[MANUAL]` Vercel 側でドメイン検証

> Vercel Dashboard → Project → Settings → Domains:
> - `${DOMAIN}` / `www.${DOMAIN}` が `Valid Configuration` になるまで `Refresh` を押す
> - 同時に SSL が `Valid` になることを確認 (Let's Encrypt 自動発行)

---

## Phase E: 切替後検証

### E-1 `[VERIFY]` HTTPS / リダイレクト / ヘッダ確認

```bash
curl -I https://${DOMAIN}
curl -I https://www.${DOMAIN}
curl -I http://${DOMAIN}
```

チェック項目:

- [ ] `HTTP/2 200` (Primary 側) / `HTTP/2 308` (Redirect 側)
- [ ] `server: Vercel`
- [ ] `strict-transport-security`、`x-frame-options`、`x-content-type-options` ヘッダ存在
- [ ] HTTP → HTTPS の 308 リダイレクト

### E-2 `[VERIFY]` SSL 証明書確認

```bash
echo | openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates
```

- [ ] Issuer が `Let's Encrypt`
- [ ] Subject が `${DOMAIN}`
- [ ] `notAfter` が約 90 日後

### E-3 `[MANUAL]` 外部スキャン

> 以下を**ブラウザで開いて A 以上の評価を確認**してください:
> - https://securityheaders.com/?q=https://${DOMAIN}
> - https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}

### E-4 `[MANUAL]` 主要ページの目視確認

> ブラウザで以下を確認:
> - トップページが正しく表示される
> - `/_next/image` 経由の画像最適化が動作している
> - クライアントサイドのナビゲーション（リンククリック）が動く
> - PR を作って **Preview URL が PR コメントに自動投稿される**こと

### E-5 `[MANUAL]` GitHub ブランチ保護

> GitHub → リポジトリ → Settings → Branches → **Add rule**:
> - Branch name pattern: `main`
> - [x] Require a pull request before merging
> - [x] Require status checks to pass before merging → `Vercel` を追加
> - [x] Require branches to be up to date before merging
> - Save

### E-6 `[MANUAL]` Cloudflare DNSSEC 有効化

> Cloudflare → DNS → Settings → **Enable DNSSEC**。
> 表示された DS レコード (KeyTag / Algorithm / Digest 等) を**レジストラの管理画面に登録**する。
> ※ レジストラ画面はサービスごとに異なるため Agent は代行不可。

---

## Phase F: 旧環境のクリーンアップ

切替成功と最低 1 週間の安定運用を確認した後にのみ実施する。

### F-1 `[AGENT:確認後]` `docker-compose.yml` / `Dockerfile` の扱い

選択肢を提示してユーザーに決定してもらう:

| 選択肢 | 内容 |
|---|---|
| 残す | ローカル開発で `docker compose up` を使い続けたい場合 |
| アーカイブ | `docs/legacy/` に移動して履歴を残す |
| 削除 | Git 履歴から消すわけではないので、不要なら削除推奨 |

### F-2 `[AGENT:確認後]` README 更新

- 「ローカル起動方法」セクションを `npm run dev` ベースに更新
- 「デプロイ」セクションに `main` への PR マージで自動デプロイされる旨を追記
- 本番 URL を記載

### F-3 `[AGENT]` 旧サーバの停止 (該当時)

旧ホスティングがある場合は、ユーザーが停止操作を完了したことを確認するだけ (操作自体は `[MANUAL]`)。

### F-4 `[AGENT:確認後]` Cloudflare TTL を通常値に戻す

> Cloudflare で `${DOMAIN}` / `www.${DOMAIN}` の TTL を `Auto` に戻すよう案内。

---

## 拡張: 完全自動化モード (オプション)

ユーザーが以下を提供した場合、Agent は MANUAL ステップの一部を CLI で代行できる。**ただし提供を求めるかどうかはユーザー判断**で、Agent から能動的にトークン要求はしない。

| トークン | 代行可能になる手順 | コマンド例 |
|---|---|---|
| `VERCEL_TOKEN` (https://vercel.com/account/tokens) | C-3 一部、C-4、C-5、D-5 | `vercel login --token`, `vercel link`, `vercel env add`, `vercel domains add`, `vercel alias` |
| Cloudflare API Token (Zone:DNS:Edit) | D-2、D-3、D-4 の自動化 | `curl https://api.cloudflare.com/client/v4/zones/.../dns_records ...` |
| `gh auth status` 済み | B-4、E-5 (`gh api` 経由) | `gh pr create`, `gh api repos/.../branches/main/protection` |

トークンが提供された場合でも、**最終的な切替実行 (D-3 相当)** は必ず `[AGENT:確認後]` 扱いとし、ユーザー承認を取ること。

---

## 失敗時のロールバック

| シナリオ | 対応 (担当区分) |
|---|---|
| Vercel ビルド失敗 | `[AGENT]` ログ取得 → 修正 PR 作成 (`[AGENT:確認後]`) |
| ドメイン検証が通らない | `[VERIFY]` `dig` 再実行 → グレー雲か再確認 (`[MANUAL]`) |
| 本番障害 | `[MANUAL]` Vercel Dashboard で前回 Deployment を **Promote to Production** → `[AGENT:確認後]` `git revert` PR 作成 |
| DNS 切替の即時切戻し | `[MANUAL]` Cloudflare で D-1 のスナップショットを元にレコードを復元 |

---

## チェックリスト (移行完了の定義)

すべて満たした時点で移行完了とする。

- [ ] `https://${DOMAIN}` / `https://www.${DOMAIN}` が 200 で表示される
- [ ] HTTP / 片側ドメインから Primary への 308 リダイレクトが動く
- [ ] Let's Encrypt の SSL が `Valid`、有効期限が 90 日後
- [ ] Cloudflare の全レコードが DNS only (グレー雲)
- [ ] DNSSEC が Active、レジストラ側に DS 登録済み
- [ ] `main` ブランチ保護で Vercel Checks が必須化されている
- [ ] PR 作成で Preview URL が自動コメントされる
- [ ] securityheaders.com / SSL Labs で A 以上
- [ ] README にローカル起動方法とデプロイフローが更新されている
- [ ] DNS スナップショットが `Docs/dns-snapshot-*.txt` に保存されている
