/**
 * 月額¥1,000プランの Stripe Product + Price を作成するスクリプト
 * 使い方: node --env-file=.env.local scripts/create-price-1000.mjs
 *
 * 出力された price id を STRIPE_PRICE_ID_1000 として .env.local / 本番環境に設定すること。
 * テスト環境・本番環境それぞれの STRIPE_SECRET_KEY で1回ずつ実行する。
 */

import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error("STRIPE_SECRET_KEY が設定されていません。--env-file=.env.local を付けて実行してください。");
  process.exit(1);
}

const stripe = new Stripe(key);

const product = await stripe.products.create({
  name: "応援会員 月額1,000円プラン",
});

const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1000,
  currency: "jpy",
  recurring: { interval: "month" },
});

console.log(`mode: ${key.startsWith("sk_test_") ? "TEST" : "LIVE"}`);
console.log(`product: ${product.id}`);
console.log(`STRIPE_PRICE_ID_1000=${price.id}`);
