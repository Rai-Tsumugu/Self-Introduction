# AUTO-UPDATE

ポートフォリオサイト（`self-introduction/`）のデータJSONを **毎週自動更新** するシステム。

## 構成

| スクリプト | 役割 | 入力 | 出力 |
|---|---|---|---|
| `src/calendar-sync.ts` | Google Calendar の予定を取得し、新しいイベントを Timeline に追記 | Google Calendar API | `self-introduction/app/data/timeline.json` |
| `src/github-sync.ts`   | 公開GitHubリポジトリの追加を検知し、OpenAI で要約して Works に追加 | GitHub REST API + OpenAI API | `self-introduction/app/data/works.json` |

両方とも **冪等**（既にあるイベント/リポは追加しない）。

## ワークフロー

```
launchd (毎週 月・水・金 13:30 JST、ローカルMacで実行)
    ↓
scripts/run-and-push.sh
    ↓
git pull → npm run sync:all → 差分チェック
    ↓
差分があれば auto/weekly-sync ブランチに commit & push
    ↓
GitHub上でレビューしてmainにマージ（または直接mainへpushする運用も可）
```

GitHub Actions は使わない（OAuth利用とSecretsを避ける方針）。

## セットアップ

```bash
cd AUTO-UPDATE
npm install
cp .env.example .env  # 各キーを設定
npm run sync:calendar   # 単発実行
npm run sync:github     # 単発実行
npm run sync:all        # 両方
```

## 必要な環境変数

| 変数 | 用途 | 取得先 |
|---|---|---|
| `GOOGLE_CALENDAR_IDS` | 取得対象カレンダーID（カンマ区切りで複数可、`label:id` 形式でラベル付与可） | Google Calendar 設定画面 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | サービスアカウント鍵（JSON文字列） | Google Cloud Console |
| `GITHUB_USERNAME` | 監視対象のGitHubユーザー名 | `Rai-Tsumugu` |
| `GITHUB_TOKEN` | (任意) レート制限緩和用 | GitHub PAT |
| `OPENAI_AUTH_MODE` | `api-key`（既定） / `codex-cli` | - |
| `OPENAI_API_KEY` | api-keyモード時必須 | OpenAI Platform |
| `OPENAI_MODEL` | (任意) api-keyモードのみ。既定 `gpt-4o-mini` | - |
| `CODEX_CLI_BIN` | (任意) codex-cli モードのバイナリ名/パス | - |

### Codex CLI モード（ChatGPT Plus/Pro サブスク利用）

```bash
npm i -g @openai/codex
codex login   # ChatGPT アカウントで OAuth ログイン（ブラウザ起動）
```

`.env` に `OPENAI_AUTH_MODE=codex-cli` を設定して `npm run sync:github` を実行すると、API キーではなく ChatGPT サブスク枠で説明文が生成される。

**制約**:
- ローカル実行のみ。GitHub Actions の週次 cron では使えない（OAuth トークン更新に対話が必要）
- CIではAPIキーモード、ローカル手動実行ではCodex CLIモード、と使い分けるのが現実的

## ディレクトリ

```
AUTO-UPDATE/
├── README.md
├── package.json
├── tsconfig.json
├── .env.example
├── scripts/
│   ├── run-and-push.sh                                 # sync → 差分があれば push
│   └── com.rakuto.self-introduction.auto-update.plist  # launchd 設定
└── src/
    ├── calendar-sync.ts       # エントリポイント: Google Calendar → timeline.json
    ├── github-sync.ts         # エントリポイント: GitHub → works.json
    ├── sync-all.ts            # 両方順次実行
    ├── lib/
    │   ├── data-store.ts      # JSON 読み書き
    │   ├── google-calendar.ts # Calendar API クライアント
    │   ├── github.ts          # GitHub API クライアント
    │   ├── openai.ts          # OpenAI クライアント（works用説明文生成）
    │   └── classify.ts        # カレンダーイベント → timeline category 推定
    └── types.ts
```

## 動作詳細

### calendar-sync

1. `GOOGLE_CALENDAR_IDS` で指定された **複数カレンダー** を順に Google Calendar API で取得（過去14日〜未来90日）。`label:id` 形式の場合、ラベルが既知（`school`/`project`/`hackathon`/`personal`）であればカテゴリを優先決定し、tags にもラベルが入る
2. 各イベントについて:
   - `id` を `evt-<date>-<slug>` 形式で生成
   - 既に `timeline.json` に同じ `id` があればスキップ
   - `summary` / `description` / カラーIDから `category` (hackathon/extraAct/project/school) を推定
3. 新規イベントだけ `events[]` に追加し、日付降順でソートして保存

### github-sync

1. `GET /users/<username>/repos?type=public&sort=created` で公開リポ一覧取得
2. 各リポについて:
   - `works.json` に `repo: "owner/name"` が既にあればスキップ
   - README + 説明 + 言語 を OpenAI に渡して、ポートフォリオ向けの和文説明 (60〜80字) と tags(3個) を生成
   - `works.json` の先頭付近に追記（`featured` は手動で後付け）

## ローカル定期実行（launchd）

macOSのlaunchdで毎週月曜 09:00 に自動実行する手順:

```bash
# 1. plist を ~/Library/LaunchAgents/ に配置（シンボリックリンク推奨）
ln -sf "$PWD/scripts/com.rakuto.self-introduction.auto-update.plist" \
       ~/Library/LaunchAgents/com.rakuto.self-introduction.auto-update.plist

# 2. 登録
launchctl load ~/Library/LaunchAgents/com.rakuto.self-introduction.auto-update.plist

# 3. 即時テスト実行
launchctl start com.rakuto.self-introduction.auto-update

# ログ確認
tail -f AUTO-UPDATE/logs/launchd.out.log
ls AUTO-UPDATE/logs/run-*.log
```

停止・解除:
```bash
launchctl unload ~/Library/LaunchAgents/com.rakuto.self-introduction.auto-update.plist
```

**確実性のための二重化**:
- 定時起動（月/水/金 13:30）に加え、**Mac 起動時 (`RunAtLoad=true`) にも実行**
- ただしスクリプト側に **冪等ガード** を実装：直近成功から 20 時間以内ならスキップ
  - 月→水→金の間隔は 48 時間あるので定時起動はガードを必ず通過
  - 週末挟みのシャットダウン明け起動などは補填として動く
- 手動で強制実行したい場合: `AUTO_UPDATE_FORCE=1 bash AUTO-UPDATE/scripts/run-and-push.sh`
- 環境変数 `AUTO_UPDATE_MIN_INTERVAL_HOURS` でガード時間を変更可（既定20）
- スタンプファイル: `AUTO-UPDATE/logs/.last-success`（削除すると即実行可能になる）

**その他の注意点**:
- Mac 本体がシャットダウン中は実行されない。`sudo pmset repeat wakeorpoweron MWF 13:25:00` で自動起動を仕込むとさらに確実
- `node` のパスは plist の `EnvironmentVariables.PATH` にハードコード（nvm利用想定）。Node更新時は要修正
- 手動実行する場合: `bash AUTO-UPDATE/scripts/run-and-push.sh`（ガード対象）

## 安全策

- スクリプトは **データJSONのみ** ステージング (`git add -- self-introduction/app/data`)
- `main` への直push はせず、`auto/weekly-sync` ブランチに force-with-lease push
- 開始前に uncommitted な変更があれば即abort
- OpenAI 出力は形式検証し、失敗時はそのリポをスキップ
- カレンダーの「private」マーク付きイベントは取り込まない
