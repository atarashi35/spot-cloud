# SPOT

SPOT はイベント管理サービスではなく、「人が残したいと思う場所」と「そこにゆるく所属したい人」をつなぐソシオ型共同体プラットフォームです。

## 技術スタック

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Firebase Auth (Google ログイン)
- Cloud Firestore
- Firebase Storage
- Stripe Billing (月額サブスクリプション)
- Stripe Connect Express (オーナーへの分配)

## ルート構成

| パス | 説明 |
|------|------|
| `/` | ランディングページ |
| `/spots` | 公開 SPOT 一覧 |
| `/spots/[spotId]` | SPOT 詳細 |
| `/spots/[spotId]/join` | ソシオ加入ページ |
| `/spots/[spotId]/member` | 限定ページ (加入者のみ) |
| `/spots/[spotId]/posts/new` | お知らせ作成 |
| `/spots/[spotId]/events/new` | イベント作成 |
| `/manage` | オーナーコンソール |
| `/owner/spots/new` | SPOT 登録 |
| `/owner/spots/[spotId]/edit` | SPOT 編集 |
| `/owner/spots/[spotId]/payout` | Stripe Connect 受取設定 |
| `/owner/spots/[spotId]/share` | QR コード共有 |
| `/account` | マイページ (加入中の SPOT 一覧) |
| `/admin` | 管理者コンソール |

## API ルート

| パス | 説明 |
|------|------|
| `POST /api/stripe/checkout` | Stripe Checkout セッション作成 |
| `POST /api/stripe/webhooks` | Stripe Webhook 受信 |
| `POST /api/stripe/connect/onboarding` | Connect Express アカウント作成 + オンボーディングリンク生成 |
| `GET /api/stripe/connect/status` | Connect アカウント状態確認 |
| `POST /api/stripe/portal` | Customer Portal セッション生成 |
| `GET /api/admin/spots` | 全 SPOT 一覧 (管理者用) |
| `PATCH /api/admin/spots/[spotId]` | SPOT の公開・停止切替 (管理者用) |

## Firestore コレクション構成

```
spots/{spotId}
spots/{spotId}/members/{uid}
users/{uid}/memberships/{spotId}
spots/{spotId}/posts/{postId}
spots/{spotId}/events/{eventId}
spots/{spotId}/events/{eventId}/participants/{uid}
```

型定義は [lib/types.ts](lib/types.ts) にまとめています。

## Stripe 方針

月額 3 プランで固定です。

- 100円 / 月
- 300円 / 月
- 500円 / 月

Stripe Connect Express でオーナーへ分配します。加入受付を開始するには、オーナーが先に受取設定 (Connect オンボーディング) を完了する必要があります。プラットフォーム手数料は `PLATFORM_FEE_PERCENT` 環境変数で設定します。

## 環境変数

[.env.example](.env.example) をコピーして `.env.local` を作成してください。

```
NEXT_PUBLIC_FIREBASE_* — Firebase クライアント設定
FIREBASE_ADMIN_*       — Firebase Admin SDK 設定
ADMIN_EMAILS           — 管理者メールアドレス (カンマ区切り)
STRIPE_SECRET_KEY      — Stripe シークレットキー
STRIPE_WEBHOOK_SECRET  — Stripe Webhook 署名シークレット
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Stripe 公開キー
STRIPE_PRICE_ID_100/300/500        — 各プランの Stripe Price ID
PLATFORM_FEE_PERCENT               — プラットフォーム手数料率 (例: 10)
```

## 起動

```bash
npm install
npm run dev
```

Node.js 20 以上を想定しています。

## 主要ファイル

| ファイル | 役割 |
|----------|------|
| [lib/types.ts](lib/types.ts) | 全型定義と `planOptions` |
| [lib/firebase/client.ts](lib/firebase/client.ts) | Firebase クライアント初期化 |
| [lib/firebase/admin.ts](lib/firebase/admin.ts) | Firebase Admin SDK 初期化 |
| [lib/stripe/config.ts](lib/stripe/config.ts) | Stripe クライアント初期化 |
| [lib/firestore/spots.ts](lib/firestore/spots.ts) | Spot の Firestore CRUD |
| [lib/firestore/memberships.ts](lib/firestore/memberships.ts) | Membership の Firestore 取得 |
| [lib/firestore/events.ts](lib/firestore/events.ts) | Event の Firestore CRUD |
| [lib/firestore/posts.ts](lib/firestore/posts.ts) | Post の Firestore CRUD |
| [lib/server/memberships.ts](lib/server/memberships.ts) | Webhook からの membership upsert (Admin SDK) |
| [lib/storage/spots.ts](lib/storage/spots.ts) | カバー画像のアップロード |
| [firestore.rules](firestore.rules) | Firestore セキュリティルール |
| [firestore.indexes.json](firestore.indexes.json) | Firestore インデックス定義 |
