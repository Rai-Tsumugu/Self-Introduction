#!/usr/bin/env bash
# AUTO-UPDATE をローカルで実行し、データJSONに差分があれば commit + push する。
# launchd / cron から呼ばれることを想定。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AUTO_UPDATE_DIR="$REPO_ROOT/AUTO-UPDATE"
DATA_GLOB="self-introduction/app/data"
BRANCH="${AUTO_UPDATE_BRANCH:-auto/weekly-sync}"
BASE_BRANCH="${AUTO_UPDATE_BASE_BRANCH:-main}"
LOG_DIR="$AUTO_UPDATE_DIR/logs"
mkdir -p "$LOG_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="$LOG_DIR/run-$TS.log"

# nvm 等で PATH が通っていない launchd 環境向け。必要に応じて override:
#   export AUTO_UPDATE_NODE_BIN=/Users/.../node
if [[ -n "${AUTO_UPDATE_NODE_BIN:-}" ]]; then
  export PATH="$(dirname "$AUTO_UPDATE_NODE_BIN"):$PATH"
fi

exec > >(tee -a "$LOG") 2>&1

echo "=== AUTO-UPDATE run: $TS ==="
echo "repo: $REPO_ROOT"
echo "branch policy: $BRANCH (base: $BASE_BRANCH)"

cd "$REPO_ROOT"

# --- 起動時補填用の冪等ガード ----------------------------------------
# launchd の RunAtLoad / Mac 起動時補填で頻繁に呼ばれても、
# 直近 MIN_INTERVAL_HOURS 以内に成功実行があれば即終了する。
# 定時起動（Mon/Wed/Fri 13:30）からの呼び出しは
# AUTO_UPDATE_FORCE=1 を立てて bypass する想定（plist 内で指定可）。
MIN_INTERVAL_HOURS="${AUTO_UPDATE_MIN_INTERVAL_HOURS:-20}"
STAMP_FILE="$LOG_DIR/.last-success"

if [[ "${AUTO_UPDATE_FORCE:-0}" != "1" && -f "$STAMP_FILE" ]]; then
  LAST=$(date -r "$STAMP_FILE" +%s 2>/dev/null || echo 0)
  NOW=$(date +%s)
  AGE_H=$(( (NOW - LAST) / 3600 ))
  if (( AGE_H < MIN_INTERVAL_HOURS )); then
    echo "skip: last success was ${AGE_H}h ago (< ${MIN_INTERVAL_HOURS}h). Set AUTO_UPDATE_FORCE=1 to bypass."
    exit 0
  fi
fi

# 念のため最新化（uncommitted があれば中断）
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: uncommitted changes exist. Aborting to avoid clobbering." >&2
  exit 1
fi

git fetch origin "$BASE_BRANCH" --quiet || true
git checkout "$BASE_BRANCH"
git pull --ff-only origin "$BASE_BRANCH" || echo "WARN: pull failed, continuing on local $BASE_BRANCH"

# 同期実行
cd "$AUTO_UPDATE_DIR"
npm run sync:all

# 差分チェック
cd "$REPO_ROOT"
if git diff --quiet -- "$DATA_GLOB"; then
  echo "no changes in $DATA_GLOB. done."
  touch "$STAMP_FILE"
  exit 0
fi

echo "changes detected:"
git status --short -- "$DATA_GLOB"

# 専用ブランチを作って push
git checkout -B "$BRANCH"
git add -- "$DATA_GLOB"
git commit -m "chore(auto-update): weekly sync ($TS)

Google Calendar / GitHub から自動同期したデータJSONの更新。
このコミットは AUTO-UPDATE/scripts/run-and-push.sh により生成。

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

git push -u origin "$BRANCH" --force-with-lease
echo "pushed $BRANCH"

git checkout "$BASE_BRANCH"

# 成功スタンプ更新（補填用の冪等ガードが参照する）
touch "$STAMP_FILE"
