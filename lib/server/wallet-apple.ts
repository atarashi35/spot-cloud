import path from "path";
import fs from "fs";
import { PKPass } from "passkit-generator";
import type { SocioCardData } from "@/lib/socio-card-data";
import { generateStripImage, generateLogoImage, generateIconImage } from "@/lib/server/wallet-card-image";

// ─── 証明書取得 ────────────────────────────────────────────────────────────────
//
// ローカル開発: secrets/wallet/spot-wallet.p12 + wwdr.pem を配置
// 本番 (App Hosting): 環境変数にBase64でセット
//   APPLE_PASS_CERT_P12_BASE64   ← spot-wallet.p12 を base64 したもの
//   APPLE_PASS_CERT_PASSWORD     ← p12 のパスワード
//   APPLE_WWDR_PEM_BASE64        ← wwdr.pem を base64 したもの（省略時はファイルから）

interface CertBuffers {
  signerCert: Buffer;
  signerKey: Buffer;
  wwdr: Buffer;
  signerKeyPassphrase?: string;
}

function getCertBuffers(): CertBuffers {
  const secretsDir = path.join(process.cwd(), "secrets/wallet");

  // wwdr
  const wwdr: Buffer = process.env.APPLE_WWDR_PEM_BASE64
    ? Buffer.from(process.env.APPLE_WWDR_PEM_BASE64, "base64")
    : fs.readFileSync(path.join(secretsDir, "wwdr.pem"));

  // 本番: 環境変数から PEM を取得
  if (process.env.APPLE_SIGNER_CERT_PEM_BASE64 && process.env.APPLE_SIGNER_KEY_PEM_BASE64) {
    return {
      signerCert: Buffer.from(process.env.APPLE_SIGNER_CERT_PEM_BASE64, "base64"),
      signerKey: Buffer.from(process.env.APPLE_SIGNER_KEY_PEM_BASE64, "base64"),
      wwdr,
    };
  }

  // ローカル: secrets/wallet/signerCert.pem + signerKey.pem から取得
  // （p12 から openssl で事前抽出したもの）
  const certPath = path.join(secretsDir, "signerCert.pem");
  const keyPath  = path.join(secretsDir, "signerKey.pem");

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error(
      `[wallet] signerCert.pem または signerKey.pem が見つかりません。\n` +
      `secrets/wallet/ に配置してください。`
    );
  }

  return {
    signerCert: fs.readFileSync(certPath),
    signerKey: fs.readFileSync(keyPath),
    wwdr,
    // signerKeyPassphrase は -nodes 抽出のため省略（空文字は不可）
  };
}

// ─── .pkpass 生成 ─────────────────────────────────────────────────────────────

export async function generateSocioPkpass(data: SocioCardData): Promise<Uint8Array> {
  const { signerCert, signerKey, wwdr, signerKeyPassphrase } = getCertBuffers();

  const spotNames = data.memberships.map((m) => m.spotName).join("\n");

  // 画像を並列生成
  const [
    icon1x, icon2x, icon3x,
    logo1x, logo2x, logo3x,
    strip1x, strip2x, strip3x,
  ] = await Promise.all([
    generateIconImage(1),
    generateIconImage(2),
    generateIconImage(3),
    generateLogoImage(1),
    generateLogoImage(2),
    generateLogoImage(3),
    generateStripImage(data.spotCount, 1),
    generateStripImage(data.spotCount, 2),
    generateStripImage(data.spotCount, 3),
  ]);

  // pass.json: storeCard タイプ（strip.png 対応）
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.app.spotcloud.socio",
    serialNumber: data.uid,
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER ?? "",
    organizationName: "SPOT",
    description: "SPOT Socio Card",

    storeCard: {
      primaryFields: [
        { key: "spots", label: "SPOTS", value: String(data.spotCount) },
      ],
      secondaryFields: [
        { key: "name", label: "NAME", value: data.displayName },
      ],
      auxiliaryFields: [],
      backFields: [
        {
          key: "spotList",
          label: "参加中のSPOT",
          value: spotNames || "まだSPOTに参加していません",
        },
        {
          key: "verifyUrl",
          label: "認証URL",
          value: `https://spotcloud.app/socio/${data.uid}`,
        },
        {
          key: "socioId",
          label: "SOCIO ID",
          value: data.uid,
        },
      ],
    },

    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: `https://spotcloud.app/socio/${data.uid}`,
        messageEncoding: "iso-8859-1",
      },
    ],
    barcode: {
      format: "PKBarcodeFormatQR",
      message: `https://spotcloud.app/socio/${data.uid}`,
      messageEncoding: "iso-8859-1",
    },

    backgroundColor: "rgb(13,13,13)",
    foregroundColor: "rgb(255,255,255)",
    labelColor: "rgb(130,130,130)",
  };

  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(passJson), "utf-8"),
      "icon.png":    icon1x,
      "icon@2x.png": icon2x,
      "icon@3x.png": icon3x,
      "logo.png":    logo1x,
      "logo@2x.png": logo2x,
      "logo@3x.png": logo3x,
      "strip.png":    strip1x,
      "strip@2x.png": strip2x,
      "strip@3x.png": strip3x,
    },
    { signerCert, signerKey, wwdr, signerKeyPassphrase }
  );

  return pass.getAsBuffer();
}

