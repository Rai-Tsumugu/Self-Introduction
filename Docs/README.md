# Docs

Self-Introduction サイトのデプロイ設計に関するドキュメント。

| ファイル | 内容 |
|---|---|
| `01_discussion_log.md` | DevOps / DX / セキュリティの 3 エージェントによる議論ログ（原文保存） |
| `02_deployment_process.md` | 議論結果を統合した実行用手順書（Phase 0〜9） |
| `03_migration_spec.md` | **Agent 実行用**の移行仕様書。各ステップに `[AGENT]` / `[AGENT:確認後]` / `[MANUAL]` / `[VERIFY]` タグ付き |
| `discussion.html` | 議事録（人間用ビジュアル版） |
| `migration.html` | 移行手順書（人間用ビジュアル版、担当区分を色分け） |

採用構成: **Vercel（ホスティング） + Cloudflare（DNS only）+ GitHub（ソース管理 / CI 連動）**
