/**
 * Google Wallet OAuth2フロー
 * ブラウザでspotcloud2026@gmail.comとしてログインし、
 * wallet_object.issuerスコープのトークンを取得する
 */
import { createServer } from "http";
import { execSync } from "child_process";
import https from "https";
import { readFileSync, writeFileSync } from "fs";
import { createSign } from "crypto";

// GCPのOAuthクライアント情報（Wallet Admin クライアント）
// 実行前に環境変数をセットしてください:
//   export WALLET_OAUTH_CLIENT_ID=...
//   export WALLET_OAUTH_CLIENT_SECRET=...
const CLIENT_ID = process.env.WALLET_OAUTH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.WALLET_OAUTH_CLIENT_SECRET ?? "";
const REDIRECT_URI = "http://localhost:9998/callback";
const SCOPE = "https://www.googleapis.com/auth/wallet_object.issuer";

const ISSUER_ID = "3388000000023154190";
const SA_EMAIL = "google-wallet-sa@spot-cloud-27aaf.iam.gserviceaccount.com";
const OWNER_EMAIL = "spotcloud2026@gmail.com";

// ─── 認証URLを開く ────────────────────────────────────────────────────────────
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPE)}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log("ブラウザを開いています...");
console.log("spotcloud2026@gmail.com でログインしてください\n");
execSync(`open "${authUrl}"`);

// ─── コールバックサーバー ─────────────────────────────────────────────────────
const code = await new Promise((resolve) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost:9998");
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    if (code) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h2>✓ 認証完了。このタブを閉じてください。</h2>");
      server.close();
      resolve(code);
    } else {
      res.writeHead(400);
      res.end(`Error: ${error}`);
      server.close();
      resolve(null);
    }
  });
  server.listen(9998);
  console.log("認証待機中... (http://localhost:9998)");
});

if (!code) {
  console.error("認証がキャンセルされました");
  process.exit(1);
}

// ─── コードをトークンと交換 ───────────────────────────────────────────────────
function httpsPost(hostname, path, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject);
    req.write(body); req.end();
  });
}

const tokenRes = await httpsPost("oauth2.googleapis.com", "/token",
  `code=${encodeURIComponent(code)}&` +
  `client_id=${CLIENT_ID}&` +
  `client_secret=${CLIENT_SECRET}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `grant_type=authorization_code`
);

const tokenData = JSON.parse(tokenRes.body);
if (!tokenData.access_token) {
  console.error("トークン取得失敗:", tokenRes.body);
  process.exit(1);
}
console.log("✓ アクセストークン取得成功");

// ─── Permissions API でSAを登録 ───────────────────────────────────────────────
console.log("\nサービスアカウントをissuerに登録中...");
const permBody = JSON.stringify({
  issuerId: ISSUER_ID,
  permissions: [
    { emailAddress: SA_EMAIL, role: "READER" },
    { emailAddress: OWNER_EMAIL, role: "OWNER" },
  ],
});

const permRes = await new Promise((resolve, reject) => {
  const req = https.request({
    hostname: "walletobjects.googleapis.com",
    path: `/walletobjects/v1/permissions/${ISSUER_ID}`,
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(permBody),
    },
  }, (res) => {
    let d = ""; res.on("data", c => d += c);
    res.on("end", () => resolve({ status: res.statusCode, body: d }));
  });
  req.on("error", reject);
  req.write(permBody); req.end();
});

console.log("Permissions API:", permRes.status, permRes.body);
