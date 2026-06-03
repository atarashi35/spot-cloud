/**
 * テスト用メンバーシップデータを全削除し、socioCount をリセットするスクリプト
 * 使い方: node --env-file=.env.local scripts/clear-test-memberships.mjs
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// ── Admin SDK 初期化 ──────────────────────────────────────────────
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌  FIREBASE_ADMIN_* 環境変数が設定されていません。.env.local を確認してください。");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();

async function deleteCollection(colRef) {
  const snapshot = await colRef.get();
  if (snapshot.empty) return 0;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

async function main() {
  let totalDeleted = 0;

  // ── 1. spots/{spotId}/members を全削除 & socioCount をリセット ──
  console.log("📦  spots コレクションを確認中...");
  const spotsSnap = await db.collection("spots").get();

  for (const spotDoc of spotsSnap.docs) {
    const membersRef = spotDoc.ref.collection("members");
    const count = await deleteCollection(membersRef);
    if (count > 0) {
      await spotDoc.ref.update({
        socioCount: 0,
        updatedAt: FieldValue.serverTimestamp()
      });
      console.log(`  ✓  spots/${spotDoc.id}/members  ${count} 件削除 → socioCount リセット`);
      totalDeleted += count;
    }
  }

  // ── 2. users/{uid}/memberships を全削除 ──
  console.log("👤  users コレクションを確認中...");
  const usersSnap = await db.collection("users").get();

  for (const userDoc of usersSnap.docs) {
    const membershipsRef = userDoc.ref.collection("memberships");
    const count = await deleteCollection(membershipsRef);
    if (count > 0) {
      console.log(`  ✓  users/${userDoc.id}/memberships  ${count} 件削除`);
      totalDeleted += count;
    }
  }

  console.log(`\n✅  合計 ${totalDeleted} 件のメンバーシップドキュメントを削除しました。`);
}

main().catch((err) => {
  console.error("❌  エラー:", err);
  process.exit(1);
});
