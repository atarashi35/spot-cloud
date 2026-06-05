/**
 * .pkpass 生成テストスクリプト
 * 実行: node --env-file=.env.local scripts/test-pkpass.mjs
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PKPass } from "passkit-generator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const secretsDir = path.join(root, "secrets/wallet");
const p12Path = path.join(secretsDir, "spot-wallet.p12");
const wwdrPath = path.join(secretsDir, "wwdr.pem");

if (!fs.existsSync(p12Path)) {
  console.error("❌ spot-wallet.p12 が見つかりません:", p12Path);
  process.exit(1);
}

const certPath = path.join(secretsDir, "signerCert.pem");
const keyPath  = path.join(secretsDir, "signerKey.pem");
const signerCert = fs.readFileSync(certPath);
const signerKey  = fs.readFileSync(keyPath);
const wwdr = fs.readFileSync(wwdrPath);
const teamId = process.env.APPLE_TEAM_IDENTIFIER ?? "";

console.log("🔑 TeamID:", teamId);
console.log("🔑 signerCert:", certPath);
console.log("🔑 signerKey:", keyPath);

const BLANK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const TEST_UID = "test-uid-1234";

const passJson = {
  formatVersion: 1,
  passTypeIdentifier: "pass.app.spotcloud.socio",
  serialNumber: TEST_UID,
  teamIdentifier: teamId,
  organizationName: "SPOT",
  description: "SPOT Socio Card",
  generic: {
    primaryFields: [{ key: "spots", label: "SPOTS", value: "3" }],
    secondaryFields: [{ key: "name", label: "NAME", value: "Test User" }],
    auxiliaryFields: [],
    backFields: [
      { key: "spotList", label: "参加中のSPOT", value: "GARAKUTA\nQ-ART" },
      { key: "verifyUrl", label: "認証URL", value: `https://spotcloud.app/socio/${TEST_UID}` },
    ],
  },
  barcodes: [{ format: "PKBarcodeFormatQR", message: `https://spotcloud.app/socio/${TEST_UID}`, messageEncoding: "iso-8859-1" }],
  barcode: { format: "PKBarcodeFormatQR", message: `https://spotcloud.app/socio/${TEST_UID}`, messageEncoding: "iso-8859-1" },
  backgroundColor: "rgb(13,13,13)",
  foregroundColor: "rgb(255,255,255)",
  labelColor: "rgb(150,150,150)",
};

try {
  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(passJson), "utf-8"),
      "icon.png": BLANK_PNG,
      "icon@2x.png": BLANK_PNG,
      "icon@3x.png": BLANK_PNG,
      "logo.png": BLANK_PNG,
      "logo@2x.png": BLANK_PNG,
      "logo@3x.png": BLANK_PNG,
    },
    { signerCert, signerKey, wwdr }
  );

  const buf = pass.getAsBuffer();
  const outPath = path.join(root, "scripts/test-output.pkpass");
  fs.writeFileSync(outPath, buf);
  console.log("✅ 生成成功:", outPath);
  console.log("   サイズ:", buf.length, "bytes");
  console.log("\niPhoneで開く場合: AirDrop または メール添付 で test-output.pkpass を転送してください。");
} catch (err) {
  console.error("❌ 生成失敗:", err.message);
  if (err.message.includes("password")) {
    console.error("   → APPLE_PASS_CERT_PASSWORD が間違っている可能性があります。");
  }
  if (err.message.includes("teamIdentifier")) {
    console.error("   → APPLE_TEAM_IDENTIFIER を確認してください。");
  }
  process.exit(1);
}
