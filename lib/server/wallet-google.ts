/**
 * Google Wallet ソシオカード生成
 *
 * GenericPass (旧 Generic Object) を使用して
 * "Add to Google Wallet" URLを生成する
 *
 * 参考: https://developers.google.com/wallet/generic/web
 */

import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import type { SocioCardData } from "@/lib/socio-card-data";

// ─── 環境変数 / ローカル設定 ──────────────────────────────────────────────────

interface GoogleWalletConfig {
  issuerId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

function getGoogleWalletConfig(): GoogleWalletConfig {
  // 本番: Secret Manager 経由の環境変数
  if (process.env.GOOGLE_WALLET_ISSUER_ID && process.env.GOOGLE_WALLET_SA_EMAIL && process.env.GOOGLE_WALLET_SA_PRIVATE_KEY) {
    return {
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
      serviceAccountEmail: process.env.GOOGLE_WALLET_SA_EMAIL,
      // Base64エンコードされた秘密鍵をデコード（改行を復元）
      privateKey: Buffer.from(process.env.GOOGLE_WALLET_SA_PRIVATE_KEY, "base64").toString("utf-8"),
    };
  }

  // ローカル: secrets/wallet/google-wallet-sa.json から取得
  try {
    const parts = ["secrets", "wallet", "google-wallet-sa.json"];
    const saPath = path.join(process.cwd(), ...parts);
    const sa = JSON.parse(fs.readFileSync(saPath, "utf-8"));
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID ?? "";
    if (!issuerId) throw new Error("GOOGLE_WALLET_ISSUER_ID が未設定です");
    return {
      issuerId,
      serviceAccountEmail: sa.client_email,
      privateKey: sa.private_key,
    };
  } catch (e) {
    throw new Error(
      `[Google Wallet] 設定が見つかりません。\n` +
      `secrets/wallet/google-wallet-sa.json を配置するか、環境変数を設定してください。\n${e}`
    );
  }
}

// ─── Pass Class の登録 ─────────────────────────────────────────────────────────
// Pass Class はGoogle Wallet APIに事前登録が必要。
// 初回は手動で登録するか、APIで自動作成する。

const CLASS_SUFFIX = "socio_card_v1";

function getClassId(issuerId: string): string {
  return `${issuerId}.${CLASS_SUFFIX}`;
}

function getObjectId(issuerId: string, uid: string): string {
  // uidはFirebase UIDなので英数字のみ想定
  return `${issuerId}.socio_${uid}`;
}

// ─── Google Wallet GenericObject ペイロード ────────────────────────────────────

function buildGenericObject(data: SocioCardData, issuerId: string) {
  const classId = getClassId(issuerId);
  const objectId = getObjectId(issuerId, data.uid);

  const spotListText = data.memberships.length > 0
    ? data.memberships.map((m) => `• ${m.spotName}`).join("\n")
    : "まだSPOTに参加していません";

  return {
    id: objectId,
    classId: classId,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    state: "ACTIVE",

    // カードのヘッダー（ロゴ横）
    cardTitle: {
      defaultValue: { language: "ja", value: "SPOT SOCIO" },
    },
    subheader: {
      defaultValue: { language: "ja", value: "地域参加証" },
    },
    header: {
      defaultValue: { language: "ja", value: data.displayName },
    },

    // メインのテキストボディ
    textModulesData: [
      {
        id: "spots_count",
        header: "SPOTS",
        body: String(data.spotCount),
      },
      {
        id: "spot_list",
        header: "参加中のSPOT",
        body: spotListText,
      },
    ],

    // バーコード（QR）
    barcode: {
      type: "QR_CODE",
      value: data.verifyUrl,
      alternateText: `SOCIO: ${data.displayName}`,
    },

    // ロゴ（左上）
    logo: {
      sourceUri: { uri: "https://spotcloud.app/spot_logomark_1024.png" },
      contentDescription: { defaultValue: { language: "ja", value: "SPOT" } },
    },

    // ヒーロー画像（本番デプロイ後に有効化）
    // heroImage: {
    //   sourceUri: { uri: "https://spotcloud.app/api/wallet/google/hero" },
    //   contentDescription: { defaultValue: { language: "ja", value: "SPOT SOCIO CARD" } },
    // },

    // 背景色
    hexBackgroundColor: "#111111",
  };
}

// ─── JWT 生成 → "Add to Google Wallet" URL ────────────────────────────────────

export function generateGoogleWalletUrl(data: SocioCardData): string {
  const config = getGoogleWalletConfig();

  const genericObject = buildGenericObject(data, config.issuerId);

  const payload = {
    iss: config.serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: ["https://spotcloud.app"],
    payload: {
      genericObjects: [genericObject],
    },
  };

  const token = jwt.sign(payload, config.privateKey, { algorithm: "RS256" });

  return `https://pay.google.com/gp/v/save/${token}`;
}
