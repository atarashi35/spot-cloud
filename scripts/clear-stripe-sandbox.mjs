/**
 * Stripe サンドボックスのテストデータを全削除するスクリプト
 * - Customer を削除すると Subscription も連動キャンセル・削除される
 * 使い方: node --env-file=.env.local scripts/clear-stripe-sandbox.mjs
 *
 * ⚠️  STRIPE_SECRET_KEY が sk_test_ で始まることを確認してから実行すること
 */

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";

if (!secretKey) {
  console.error("❌  STRIPE_SECRET_KEY が設定されていません。");
  process.exit(1);
}

if (!secretKey.startsWith("sk_test_")) {
  console.error("❌  本番キー (sk_live_) が設定されています。テストキー (sk_test_) のみ実行できます。");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function deleteAllCustomers() {
  let deleted = 0;
  let hasMore = true;
  let startingAfter = undefined;

  console.log("👤  Customers を削除中...");

  while (hasMore) {
    const list = await stripe.customers.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {})
    });

    for (const customer of list.data) {
      try {
        await stripe.customers.del(customer.id);
        console.log(`  ✓  ${customer.id}  ${customer.email ?? "(no email)"}`);
        deleted++;
      } catch (err) {
        console.warn(`  ⚠️  ${customer.id} の削除に失敗: ${err.message}`);
      }
    }

    hasMore = list.has_more;
    if (hasMore && list.data.length > 0) {
      startingAfter = list.data[list.data.length - 1].id;
    }
  }

  return deleted;
}

async function cancelRemainingSubscriptions() {
  // Customer 削除で紐づくサブスクリプションはキャンセルされるが、
  // 念のため残存している active / trialing なものを確認してキャンセル
  let cancelled = 0;

  const list = await stripe.subscriptions.list({ limit: 100, status: "active" });

  for (const sub of list.data) {
    try {
      await stripe.subscriptions.cancel(sub.id);
      console.log(`  ✓  subscription ${sub.id} をキャンセル`);
      cancelled++;
    } catch (err) {
      console.warn(`  ⚠️  ${sub.id} のキャンセルに失敗: ${err.message}`);
    }
  }

  return cancelled;
}

async function main() {
  console.log(`🔑  プロジェクト: ${secretKey.slice(0, 20)}...`);
  console.log("");

  const deletedCustomers = await deleteAllCustomers();
  const cancelledSubs = await cancelRemainingSubscriptions();

  console.log(`
✅  完了
   削除した Customer    : ${deletedCustomers} 件
   残存キャンセル Subscription: ${cancelledSubs} 件
`);
}

main().catch((err) => {
  console.error("❌  エラー:", err.message);
  process.exit(1);
});
