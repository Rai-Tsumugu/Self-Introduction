# Self-Introduction

自己紹介サイト。Next.js アプリを Vercel でホスティング。

## 構成

```
Self-Introduction/
├── self-introduction/  # Next.js アプリ
├── Docs/               # 設計・移行ドキュメント
└── README.md
```

採用構成: **Vercel(ホスティング) + Cloudflare(DNS only) + GitHub(ソース管理 / CI 連動)**

## ローカル開発

```bash
cd self-introduction
npm install
npm run dev
```

http://localhost:3000

## Vercel デプロイ

GitHub と連携済みであれば、`main` への push で自動的に本番デプロイされる。

初回セットアップ:

1. [Vercel](https://vercel.com/) で GitHub リポジトリをインポート
2. Root Directory に `self-introduction` を指定
3. Framework Preset = Next.js(自動検出)
4. デプロイ

詳細手順は `Docs/02_deployment_process.md` を参照。
