# selfie (プロフ帳) — 本番デプロイ依頼 (EKS チーム向け)

社内オンボーディング用の自己紹介シート共有アプリ **プロフ帳** を `bdd-eks` に出すための K8s 側作業依頼です。**アプリ実装 + Dockerfile + CI (ECR push まで) は完了済**。本ページの作業で本番稼働します。

- リポジトリ: <https://github.com/taiki3/selfie>
- 公開予定 URL: `https://selfie.bdddx.agc.jp`
- 構成: `selfie-web` (nginx + Vite ビルド、`/api` を `selfie-api` にプロキシ) / `selfie-api` (Fastify + PostgreSQL)

## 責任分界点

| 範囲 | 担当 | 状態 |
|---|---|---|
| アプリ実装 (web / api) | selfie 開発 (yoshinaka) | ✅ 完了 |
| Dockerfile (`api/Dockerfile`, `web/Dockerfile`) | selfie 開発 | ✅ 完了 |
| CI (lint/test/build + ECR push) `.github/workflows/ci.yml` | selfie 開発 | ✅ 完了 |
| **ECR リポジトリ作成** | EKS チーム | ⬜ 本依頼 |
| **GitHub Actions 変数設定 + runner スコープ** | EKS チーム | ⬜ 本依頼 |
| **PostgreSQL 構築** | EKS チーム | ⬜ 本依頼 |
| **Secret (SOPS) + Flux マニフェスト反映** | EKS チーム | ⬜ 本依頼 |

## CI が生成するもの

`main` への push で `.github/workflows/ci.yml` の `build-push` ジョブが 2 イメージを ECR に push します（タグ `latest` と `sha-<git-sha>`、`build-push` は ARC runner `arc-runner-set` 上で EKS Pod Identity 経由）。

- `150596267098.dkr.ecr.ap-northeast-1.amazonaws.com/selfie-api`
- `150596267098.dkr.ecr.ap-northeast-1.amazonaws.com/selfie-web`

## ご対応依頼

### 1. リポジトリ位置 / runner スコープ

`build-push` は self-hosted ARC runner `arc-runner-set`（`AGC-DI-DSG` org 登録）を使います。現状リポジトリは `taiki3/selfie` のため、いずれかをお願いします:

- リポジトリを `AGC-DI-DSG` org へ移管（ayas / vixelo と同様）、**または**
- このリポジトリ向けに runner set を登録

> lint/test/build ジョブ (`api-ci` / `web-ci`) は GitHub-hosted `ubuntu-latest` なので移管前でも動作します。ECR push だけが self-hosted runner を必要とします。

### 2. ECR リポジトリ作成

`selfie-api` と `selfie-web` を作成してください（infra の ECR 管理に合わせて）。ライフサイクルポリシーは他アプリ準拠で構いません。

### 3. GitHub Actions 変数 (repo or org `vars`)

`build-push` が参照します（ayas / vixelo と同値）:

| 変数 | 値 |
|---|---|
| `ECR_REGISTRY` | `150596267098.dkr.ecr.ap-northeast-1.amazonaws.com` |
| `HTTP_PROXY` | `http://10.58.254.244:7080` |
| `HTTPS_PROXY` | `http://10.58.254.244:7080` |
| `NO_PROXY` | `localhost,127.0.0.1,169.254.169.254,.agc.jp,.cluster.local,10.0.0.0/8,100.64.0.0/16,172.20.0.0/16` |

### 4. PostgreSQL 構築

このアプリ用の PostgreSQL を 1 つ用意してください（StatefulSet / RDS いずれでも可）。

- データベース名: `selfie`、専用ユーザー: `selfie`
- **空の DB で OK**: `selfie-api` は起動時に自動でマイグレーション (`api/migrations/`) とサンプルデータ投入（初回・空のときのみ）を実行します。
- 接続情報は手順 5 の Secret `DATABASE_URL` に入れてください。
- 規模感: 社内オンボーディング用途。データは軽量（プロフ数十〜数百件）。写真はクロップ済み JPEG (480px) を **DB に data URL で保存**し `/api/sheets/:id/photo` で配信します（1 件 ~50–100 KB）。専用 S3 は不要。

### 5. Secret `selfie-secrets` (SOPS 暗号化)

`deploy/secret.example.yaml` のキーを SOPS + age で暗号化し `apps/selfie/secret.enc.yaml` としてコミットしてください。

```yaml
stringData:
  DATABASE_URL:   "postgres://selfie:<password>@<host>:5432/selfie"
  SESSION_SECRET: "<openssl rand -hex 32>"   # 管理者セッション cookie 署名用
  ADMIN_PASSWORD: "<管理者パスワード>"          # 昼食会日程入力用（プロトタイプの lunch2026 を置換）
```

`SESSION_SECRET` / `ADMIN_PASSWORD` は運用 (yoshinaka) から 1Password 共有で別途送付します。

### 6. Flux マニフェスト反映

`deploy/` 配下のマニフェスト（`kubectl kustomize deploy/` で検証済・12 リソース）をベースに `bdd/devops apps/selfie/` を作成してください。

含まれるもの: `namespace.yaml` / `configmap.yaml` / `api-deployment.yaml` (+Service) / `web-deployment.yaml` (+Service) / `ingress.yaml` / `image-automation.yaml`（`secret.enc.yaml` は手順 5）。

- Ingress: ALB `group.name: bdd-shared`、`internal`、`target-type: ip`、ACM cert は ayas と同一、host `selfie.bdddx.agc.jp`
- image-automation: `:latest` の digest を `digestReflectionPolicy: Always` で追従（ayas と同方式）。`ImageUpdateAutomation.sourceRef` の GitRepository 名（`bdd-eks-rw` 想定）は実際の名前に合わせて修正してください。
- `apps/kustomization.yaml` と `apps/selfie-ks.yaml`（Flux Kustomization エントリ）への追加もお願いします。

### 7. DNS

`selfie.bdddx.agc.jp` を `bdd-shared` ALB に向けてください（他アプリと同様）。

## 反映後スモークテスト

- [ ] `selfie-api` Pod 起動成功（boot log に `[migrate] applied 001_init.sql` と `Server listening`）
- [ ] `kubectl -n selfie exec deploy/selfie-api -- wget -qO- localhost:3001/ready` → `{"status":"ready"}`（DB 疎通込み）
- [ ] `curl -s https://selfie.bdddx.agc.jp/api/sheets | jq length` → 初回は `6`（サンプル）
- [ ] ブラウザで `https://selfie.bdddx.agc.jp/` → フィード表示、プロフ作成（PIN 設定）→ マイシートに保存
- [ ] 管理者ボタン → `ADMIN_PASSWORD` でログイン → 詳細画面で昼食会日程を入力できる（一般ユーザーは入力欄が出ない＝読み取り専用）

## 補足

- **認証はサーバー側**: PIN は bcrypt ハッシュで保存し編集時にサーバー検証、管理者は `ADMIN_PASSWORD` → 署名付き cookie セッション、昼食会日程入力は管理者のみ（設計の「本番ではサーバー側認証」要件を満たす）。
- リアクションは匿名 client cookie（`selfie_client`、httpOnly 署名付き）で重複防止。
- `selfie-api` は外部 egress 無し（in-cluster Postgres のみ）。runtime proxy 不要。
- レプリカは web / api とも 2、RollingUpdate（maxUnavailable: 0）でゼロダウンタイム。session は cookie 署名のみでサーバー状態を持たないため複数レプリカで問題なし。
