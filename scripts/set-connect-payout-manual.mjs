/**
 * 既存のConnectアカウント全件の送金スケジュールを "manual" に統一するスクリプト。
 * 四半期バッチ送金(app/api/cron/quarterly-payout)導入前に作成済みのアカウントに対して1回実行する。
 * 使い方: node --env-file=.env.local scripts/set-connect-payout-manual.mjs
 */

import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error("STRIPE_SECRET_KEY が設定されていません。--env-file=.env.local を付けて実行してください。");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")
  })
});

const db = getFirestore();

console.log(`mode: ${stripeKey.startsWith("sk_test_") ? "TEST" : "LIVE"}`);

const snapshot = await db.collection("spots").get();
const accountIds = snapshot.docs
  .map((doc) => doc.data().stripeConnectedAccountId)
  .filter((id) => typeof id === "string" && id.length > 0);

console.log(`対象アカウント数: ${accountIds.length}`);

for (const accountId of accountIds) {
  try {
    await stripe.accounts.update(accountId, {
      settings: {
        payouts: {
          schedule: {
            interval: "manual"
          }
        }
      }
    });
    console.log(`OK  ${accountId}`);
  } catch (error) {
    console.error(`NG  ${accountId}: ${error instanceof Error ? error.message : error}`);
  }
}
