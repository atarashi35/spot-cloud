/**
 * Google Wallet APIのissuer permissionsにサービスアカウントを追加するスクリプト
 * OAuth2ブラウザフローでwalletスコープのトークンを取得する
 */
import { createServer } from "http";
import { execSync } from "child_process";
import https from "https";
import querystring from "querystring";

const CLIENT_ID = "32555940559.apps.googleusercontent.com"; // gcloud CLIのクライアントID
const REDIRECT_URI = "http://localhost:9999/callback";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";
const ISSUER_ID = "3388000000023154190";
const SA_EMAIL = "google-wallet-sa@spot-cloud-27aaf.iam.gserviceaccount.com";
const OWNER_EMAIL = "spotcloud2026@gmail.com";

// 別のアプローチ: サービスアカウントのJWTで直接API呼び出し
// wallet_object.issuer スコープでトークンを生成する
import { readFileSync } from "fs";
import { createSign } from "crypto";

const sa = JSON.parse(readFileSync("secrets/wallet/google-wallet-sa.json", "utf-8"));

function makeJwt(scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const sig = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(sa.private_key, "base64url");
  return `${header}.${payload}.${sig}`;
}

async function getToken(scope) {
  return new Promise((resolve, reject) => {
    const body = querystring.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: makeJwt(scope),
    });
    const req = https.request({
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        const json = JSON.parse(d);
        if (json.access_token) resolve(json.access_token);
        else reject(new Error(JSON.stringify(json)));
      });
    });
    req.write(body);
    req.end();
  });
}

async function callPermissionsApi(token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      issuerId: ISSUER_ID,
      permissions: [
        { emailAddress: SA_EMAIL, role: "READER" },
        { emailAddress: OWNER_EMAIL, role: "OWNER" },
      ],
    });
    const req = https.request({
      hostname: "walletobjects.googleapis.com",
      path: `/walletobjects/v1/permissions/${ISSUER_ID}`,
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// まずcloud-platformスコープで試す（issuerのオーナーはgcloud経由で認証済み）
console.log("cloud-platform スコープでトークン取得中...");
try {
  const token = await getToken("https://www.googleapis.com/auth/cloud-platform");
  console.log("トークン取得成功。Permissions API呼び出し中...");
  const result = await callPermissionsApi(token);
  console.log("レスポンス:", result.status, result.body);
} catch (e) {
  console.error("失敗:", e.message);
}
