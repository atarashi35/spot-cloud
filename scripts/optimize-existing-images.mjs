// Run a read-only inventory by default. --apply creates new objects and updates
// unchanged Firestore references; existing objects are never overwritten.
import { createHash, createSign, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const apply = process.argv.includes("--apply");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : Infinity;
if (!(limit > 0)) throw new Error("Invalid limit");
const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!bucket || !process.env.FIREBASE_ADMIN_PRIVATE_KEY || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) throw new Error("Firebase configuration missing");
initializeApp({ credential: cert({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n") }) });
const db = getFirestore();
const base64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
async function token() {
  const now = Math.floor(Date.now() / 1000);
  const content = `${base64({ alg: "RS256", typ: "JWT" })}.${base64({ iss: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/devstorage.read_write", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const signer = createSign("RSA-SHA256"); signer.update(content);
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${content}.${signer.sign(process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"), "base64url")}` }) });
  if (!response.ok) throw new Error(`Storage authentication failed (${response.status})`);
  return (await response.json()).access_token;
}
function storagePath(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.hostname === "firebasestorage.googleapis.com") {
      const prefix = `/v0/b/${bucket}/o/`;
      return url.pathname.startsWith(prefix) ? decodeURIComponent(url.pathname.slice(prefix.length)) : null;
    }
    if (url.hostname === "storage.googleapis.com" && url.pathname.startsWith(`/${bucket}/`)) return decodeURIComponent(url.pathname.slice(bucket.length + 2));
  } catch { /* skip invalid URLs */ }
  return null;
}
function candidates(data, kind) {
  const values = [];
  if (kind === "spot") {
    if (data.coverImageUrl) values.push(data.coverImageUrl);
    if (Array.isArray(data.galleryImageUrls)) values.push(...data.galleryImageUrls);
    if (Array.isArray(data.teamMembers)) values.push(...data.teamMembers.map((v) => v?.avatarUrl));
  }
  if (kind === "post") {
    if (data.imageUrl) values.push(data.imageUrl);
    if (Array.isArray(data.attachments)) values.push(...data.attachments.filter((v) => v?.type === "image").map((v) => v.url));
  }
  if (kind === "event" && data.imageUrl) values.push(data.imageUrl);
  if (kind === "user" && data.avatarUrl) values.push(data.avatarUrl);
  return values.filter((value) => storagePath(value));
}
function updateFields(data, kind, mapping) {
  const out = {};
  const replace = (v) => mapping.get(v) ?? v;
  if (kind === "spot") {
    if (data.coverImageUrl && mapping.has(data.coverImageUrl)) out.coverImageUrl = replace(data.coverImageUrl);
    if (Array.isArray(data.galleryImageUrls) && data.galleryImageUrls.some((v) => mapping.has(v))) out.galleryImageUrls = data.galleryImageUrls.map(replace);
    if (Array.isArray(data.teamMembers) && data.teamMembers.some((v) => mapping.has(v?.avatarUrl))) out.teamMembers = data.teamMembers.map((v) => ({ ...v, ...(mapping.has(v?.avatarUrl) ? { avatarUrl: replace(v.avatarUrl) } : {}) }));
  }
  if (kind === "post") {
    if (data.imageUrl && mapping.has(data.imageUrl)) out.imageUrl = replace(data.imageUrl);
    if (Array.isArray(data.attachments) && data.attachments.some((v) => v?.type === "image" && mapping.has(v.url))) out.attachments = data.attachments.map((v) => v?.type === "image" && mapping.has(v.url) ? { ...v, url: replace(v.url) } : v);
  }
  if (kind === "event" && mapping.has(data.imageUrl)) out.imageUrl = replace(data.imageUrl);
  if (kind === "user" && mapping.has(data.avatarUrl)) out.avatarUrl = replace(data.avatarUrl);
  return out;
}
const spots = await db.collection("spots").get();
const docs = [];
for (const doc of spots.docs) {
  docs.push({ ref: doc.ref, kind: "spot", data: doc.data() });
  const [posts, events] = await Promise.all([doc.ref.collection("posts").get(), doc.ref.collection("events").get()]);
  posts.docs.forEach((item) => docs.push({ ref: item.ref, kind: "post", data: item.data() }));
  events.docs.forEach((item) => docs.push({ ref: item.ref, kind: "event", data: item.data() }));
}
const users = await db.collection("users").get();
users.docs.forEach((item) => docs.push({ ref: item.ref, kind: "user", data: item.data() }));
const urls = [...new Set(docs.flatMap(({ kind, data }) => candidates(data, kind)))];
const report = { scannedDocuments: docs.length, imageReferences: urls.length, optimized: 0, skipped: 0, failures: 0, originalBytes: 0, optimizedBytes: 0, updatedDocuments: 0, conflicts: 0 };
const mapping = new Map();
const backups = [];
const access = apply ? await token() : null;
for (const source of urls) {
  if (report.optimized >= limit) break;
  try {
    const object = storagePath(source);
    if (!object || object.includes(".spot-optimized-")) { report.skipped++; continue; }
    const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error("download failed");
    const original = Buffer.from(await response.arrayBuffer());
    if (original.length > 30 * 1024 * 1024) throw new Error("image too large");
    const meta = await sharp(original, { limitInputPixels: 100_000_000, animated: true }).metadata();
    if ((meta.pages ?? 1) > 1 || !["jpeg", "png", "webp", "heif", "avif"].includes(meta.format)) { report.skipped++; continue; }
    const optimized = await sharp(original, { limitInputPixels: 100_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    if (optimized.length >= original.length * 0.8) { report.skipped++; continue; }
    report.optimized++; report.originalBytes += original.length; report.optimizedBytes += optimized.length;
    if (!apply) continue;
    const suffix = createHash("sha256").update(original).digest("hex").slice(0, 20);
    const destination = `${object}.spot-optimized-${suffix}.webp`;
    let downloadToken = randomUUID();
    const boundary = `spot_${randomUUID().replaceAll("-", "")}`;
    const metadata = JSON.stringify({ name: destination, contentType: "image/webp", cacheControl: "public,max-age=31536000", metadata: { firebaseStorageDownloadTokens: downloadToken } });
    const upload = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: image/webp\r\n\r\n`), optimized, Buffer.from(`\r\n--${boundary}--\r\n`)]);
    const result = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=multipart&ifGenerationMatch=0`, { method: "POST", headers: { Authorization: `Bearer ${access}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body: upload, signal: AbortSignal.timeout(30000) });
    if (result.status === 412) {
      const existing = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(destination)}`, { headers: { Authorization: `Bearer ${access}` }, signal: AbortSignal.timeout(30000) });
      if (!existing.ok) throw new Error("existing image lookup failed");
      const existingMetadata = await existing.json();
      downloadToken = String(existingMetadata.metadata?.firebaseStorageDownloadTokens ?? "").split(",")[0];
      if (!downloadToken) throw new Error("existing image has no download token");
    } else if (!result.ok) throw new Error(`upload ${result.status}`);
    const target = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;
    const verify = await fetch(target, { signal: AbortSignal.timeout(30000) });
    if (!verify.ok || !Buffer.from(await verify.arrayBuffer()).equals(optimized)) throw new Error("verification failed");
    mapping.set(source, target);
  } catch { report.failures++; }
}
if (apply) {
  const dir = path.join(os.homedir(), ".local", "share", "spot-cloud", "image-migrations");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const backupPath = path.join(dir, `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.json`);
  for (const entry of docs) {
    const changes = updateFields(entry.data, entry.kind, mapping);
    if (Object.keys(changes).length) backups.push({ path: entry.ref.path, fields: Object.fromEntries(Object.keys(changes).map((key) => [key, entry.data[key]])) });
  }
  await writeFile(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), documents: backups }, null, 2), { mode: 0o600, flag: "wx" });
  for (const entry of docs) {
    const changes = updateFields(entry.data, entry.kind, mapping);
    const keys = Object.keys(changes); if (!keys.length) continue;
    try {
      const updated = await db.runTransaction(async (tx) => {
        const current = await tx.get(entry.ref); if (!current.exists) return false;
        if (keys.some((key) => JSON.stringify(current.data()?.[key]) !== JSON.stringify(entry.data[key]))) return false;
        tx.update(entry.ref, changes); return true;
      });
      if (updated) report.updatedDocuments++; else report.conflicts++;
    } catch { report.failures++; }
  }
  console.log(JSON.stringify({ ...report, backupPath }));
} else console.log(JSON.stringify(report));
if (report.failures || report.conflicts) process.exitCode = 1;
