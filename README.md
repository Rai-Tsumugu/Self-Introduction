# Self-Introduction

自己紹介サイト。Next.js アプリを Docker でコンテナ化し、Google Cloud (Cloud Run) へのデプロイを想定した構成。

## 構成

```
Self-Introduction/
├── blog/              # Next.js アプリ
├── docker-compose.yml
└── README.md
```

## ローカル開発

```bash
cd blog && npm install && npm run dev
```

## Docker で起動

```bash
docker compose up --build
```

http://localhost:3000

停止:

```bash
docker compose down
```

## Cloud Run へのデプロイ

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
