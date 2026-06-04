/**
 * Firebase Authentication で TOTP 多要素認証を有効化するスクリプト
 * 一回だけ実行すれば OK。
 *
 * 使い方:
 *   node --env-file=.env.local scripts/enable-totp-mfa.mjs
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId   = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ .env.local に FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY が必要です。");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const auth = getAuth();

await auth.projectConfigManager().updateProjectConfig({
  multiFactorConfig: {
    providerConfigs: [{
      state: "ENABLED",
      totpProviderConfig: {
        adjacentIntervals: 5,
      },
    }],
  },
});

console.log("✅ TOTP 多要素認証を有効化しました。");
