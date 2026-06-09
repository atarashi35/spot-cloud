/**
 * Google Wallet GenericClass作成スクリプト
 * Node 16対応版（googleapis使わずjwt直接）
 */
import { readFileSync } from "fs";
import { createSign } from "crypto";
import https from "https";

const ISSUER_ID = "3388000000023154190";
const CLASS_ID = `${ISSUER_ID}.socio_card_v1`;
const SA_PATH = "secrets/wallet/google-wallet-sa.json";

const sa = JSON.parse(readFileSync(SA_PATH, "utf-8"));

// ─── サービスアカウントでアクセストークン取得 ─────────────────────────────────
function makeJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const sig = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(sa.private_key, "base64url");
  return `${header}.${payload}.${sig}`;
}

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// トークン取得
const tokenBody = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${makeJwt()}`;
const tokenRes = await httpsRequest({
  hostname: "oauth2.googleapis.com",
  path: "/token",
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
}, tokenBody);

const { access_token, error } = JSON.parse(tokenRes.body);
if (!access_token) {
  console.error("トークン取得失敗:", tokenRes.body);
  process.exit(1);
}
console.log("✓ アクセストークン取得成功");

// ─── GenericClass作成 ─────────────────────────────────────────────────────────
console.log("\nGenericClass作成中...");
const classBody = JSON.stringify({
  id: CLASS_ID,
});

const classRes = await httpsRequest({
  hostname: "walletobjects.googleapis.com",
  path: "/walletobjects/v1/genericClass",
  method: "POST",
  headers: {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(classBody),
  },
}, classBody);

if (classRes.status === 200 || classRes.status === 201) {
  console.log("✓ GenericClass作成成功");
} else if (classRes.status === 409) {
  console.log("✓ GenericClassは既に存在（OK）");
} else {
  console.log("✗ GenericClass作成失敗:", classRes.status);
  console.log(classRes.body);
}

// ─── Permissions確認 ─────────────────────────────────────────────────────────
console.log("\nPermissions確認中...");
const permRes = await httpsRequest({
  hostname: "walletobjects.googleapis.com",
  path: `/walletobjects/v1/permissions/${ISSUER_ID}`,
  method: "GET",
  headers: { "Authorization": `Bearer ${access_token}` },
});
console.log("Permissions:", permRes.status, permRes.body);
