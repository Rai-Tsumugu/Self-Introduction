# Self-Introduction

自己紹介サイトのモノレポ。Next.js アプリを Docker でコンテナ化し、Google Cloud (Cloud Run) へのデプロイを想定した構成。

## 構成

```
Self-Introduction/
├── blog/              # Next.js アプリ (ポート 3000)
├── blog-timeline/     # Next.js アプリ (ポート 3001)
├── portfolio/         # （未実装）
├── Self-Introduce.html
├── docker-compose.yml
└── README.md
```

## ローカル開発

各アプリ個別:

```bash
cd blog && npm install && npm run dev
cd blog-timeline && npm install && npm run dev
```

## Docker でまとめて起動

```bash
docker compose up --build
```

- blog: http://localhost:3000
- blog-timeline: http://localhost:3001

停止:

```bash
docker compose down
```

## Cloud Run へのデプロイ

各アプリ個別にデプロイする。例: `blog`

```bash
# 1. Artifact Registry にイメージを push
gcloud builds submit ./blog \
  --tag asia-northeast1-docker.pkg.dev/<PROJECT_ID>/self-introduction/blog:latest

# 2. Cloud Run にデプロイ
gcloud run deploy blog \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/self-introduction/blog:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000
```

`blog-timeline` も同様の手順でデプロイ可能。
