# Docs

Self-Introduction サイトのデプロイ設計に関するドキュメント。

| ファイル | 内容 |
|---|---|
| `01_discussion_log.md` | DevOps / DX / セキュリティの 3 エージェントによる議論ログ（原文保存） |
| `02_deployment_process.md` | 議論結果を統合した実行用手順書（Phase 0〜9） |
| `03_migration_spec.md` | **Agent 実行用**の移行仕様書。各ステップに `[AGENT]` / `[AGENT:確認後]` / `[MANUAL]` / `[VERIFY]` タグ付き |

採用構成: **Vercel（ホスティング） + Cloudflare（DNS only）+ GitHub（ソース管理 / CI 連動）**
