# プロフ帳 (selfie)

社内のオンボーディング・チーム配属向けの、ポップでかわいい **自己紹介シート共有アプリ**。
[Claude Design](https://claude.ai/design) のモックを実プロダクトとして実装したもの。

| | |
|---|---|
| フロント | Vite + React + TypeScript（nginx 配信） |
| バックエンド | Fastify + TypeScript |
| DB | PostgreSQL |
| デプロイ先 | 社内 EKS `bdd-eks`（`https://selfie.bdddx.agc.jp`） |

## 機能

- **みんなのプロフ**: ぷっくりカードのフィード。部署フィルター + ランチ会日付フィルター。
- **シート詳細**: リアクション4種（💕⭐👏😊）+ コメント。
- **作成・編集**: 自作SVGアバター8種×体色6色 / 写真アップロード（正方形クロップ） / キャッチコピー / 趣味タグ / 最近あったよかったこと / 今年の抱負 / やってみたいこと。
- **PIN 編集ロック**: 4桁 PIN（bcrypt、サーバー側検証）。編集時に要求、暗証番号変更も可。
- **管理者モード**: パスワード（サーバー側、署名 cookie セッション）。**昼食会の日程**は管理者のみ入力可（個人は読み取り専用）。
- **ランチ会カレンダー**: 開催日にアンダーバー、日付選択でメンバー絞り込み。
- **デザイン設定**: ポップ / ニュートラル / ミニマルの3スタイル + テーマカラー / フォント / 装飾量（localStorage 保存）。

## 構成

```
selfie/
├── api/        Fastify + PostgreSQL バックエンド (TypeScript)
│   ├── src/            ルート, データアクセス, 認証, シード
│   ├── migrations/     起動時に自動適用される SQL
│   └── Dockerfile
├── web/        Vite + React フロントエンド (TypeScript)
│   ├── src/            画面・コンポーネント・API クライアント
│   ├── nginx.conf      SPA + /api プロキシ + セキュリティヘッダ
│   └── Dockerfile
├── deploy/     EKS チーム向け Flux マニフェスト + デプロイ依頼 (README.md)
├── .github/workflows/ci.yml   lint/test/build + ECR push
└── docker-compose.yml         ローカル開発スタック
```

`selfie-web`(nginx) が静的アセットを配信し `/api/*` を `selfie-api:3001` にプロキシ。`selfie-api` が PostgreSQL を読み書きする。

## ローカル開発

### Docker Compose（推奨・本番に近い）

```bash
docker compose up --build
# → http://localhost:8088
```

DB / API / web が一括起動。API は起動時にマイグレーション + サンプルデータ投入（空 DB のみ）。
社内ネットワークでは proxy build-arg が必要なので、`HTTP_PROXY` 等を export してから実行する。

### 個別（ホットリロード）

```bash
# 1) DB だけ Compose で
docker compose up -d selfie-db

# 2) API
cd api && npm install
DATABASE_URL=postgres://selfie:selfie@localhost:5432/selfie npm run dev   # :3001

# 3) web（/api を :3001 にプロキシ）
cd web && npm install && npm run dev    # :5173
```

## 各種コマンド

| | api/ | web/ |
|---|---|---|
| 型チェック | `npm run typecheck` | `npm run typecheck` |
| テスト | `npm test`（要 `DATABASE_URL`、無ければ DB 統合テストはスキップ） | `npm test` |
| ビルド | `npm run build` | `npm run build` |

## 主な環境変数（api）

| 変数 | 既定 | 説明 |
|---|---|---|
| `PORT` | `3001` | 待受ポート |
| `DATABASE_URL` | （ローカル既定あり） | PostgreSQL 接続文字列 |
| `ADMIN_PASSWORD` | `lunch2026` | 管理者パスワード（本番は Secret で上書き必須） |
| `SESSION_SECRET` | dev用 | 管理者 cookie 署名鍵（本番は Secret で上書き必須） |
| `SECURE_COOKIES` | `false` | HTTPS 配下では `true`（ALB 背後） |
| `ALLOWED_ORIGINS` | 空 | CORS 許可オリジン（同一オリジン運用では不要） |

## CI / デプロイ

- **CI** (`.github/workflows/ci.yml`): PR / push で型チェック・テスト・ビルド（`ubuntu-latest`）。`main` push で Docker イメージを ECR に push（self-hosted ARC runner、EKS Pod Identity）。
- **デプロイ**: EKS チームが担当。手順とマニフェストは [`deploy/README.md`](deploy/README.md)。DB は EKS 側で用意。

## 由来

Claude Design のハンドオフバンドル（`プロフ帳アプリ.html` ほか）を実装したもの。プロトタイプの設計意図・反復経緯はデザインのチャット履歴に基づく。
