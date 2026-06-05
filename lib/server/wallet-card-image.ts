/**
 * Apple Wallet カード背景画像を生成する
 * Generic pass は background.png 非対応なので
 * strip.png（ヘッダー下の帯）を使うため storeCard タイプに変更する
 *
 * strip.png サイズ: 375×144 pt → @2x 750×288 px → @3x 1125×432 px
 * thumbnail.png: 90×90 pt → @2x 180×180 px
 */

import sharp from "sharp";

// ─── 赤コア + 軌道ドットをSVGで描画 ─────────────────────────────────────────

function buildStripSvg(width: number, height: number, spotCount: number): string {
  const cx = width * 0.72;  // コアのX（右寄り）
  const cy = height * 0.5;  // コアのY（中央）

  // 軌道ドットの配置（静止版：均等に散らす）
  const dotCount = Math.max(spotCount, 1);
  const rings = [
    { r: height * 0.28, speed: 1.0 },
    { r: height * 0.42, speed: 0.8 },
    { r: height * 0.56, speed: 0.6 },
    { r: height * 0.70, speed: 0.5 },
  ];

  const dots: { x: number; y: number; size: number; opacity: number }[] = [];
  for (let i = 0; i < dotCount; i++) {
    const ringIndex = i % rings.length;
    const ring = rings[ringIndex];
    const posInRing = Math.floor(i / rings.length);
    const totalInRing = Math.ceil(dotCount / rings.length);
    const angle = ((posInRing / totalInRing) * 360 + ringIndex * 37) * (Math.PI / 180);
    dots.push({
      x: cx + Math.cos(angle) * ring.r,
      y: cy + Math.sin(angle) * ring.r,
      size: 3 - ringIndex * 0.4,
      opacity: 0.7 - ringIndex * 0.13,
    });
  }

  const dotsSvg = dots
    .map((d) => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.size.toFixed(1)}" fill="rgba(255,255,255,${d.opacity.toFixed(2)})"/>`)
    .join("\n");

  const coreR = height * 0.12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <radialGradient id="core" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff4d3f"/>
      <stop offset="60%" stop-color="#e8261a"/>
      <stop offset="100%" stop-color="#a01a11"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e8261a" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#e8261a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bg" cx="72%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0d0d0d"/>
    </radialGradient>
  </defs>

  <!-- 背景 -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- コアグロー -->
  <circle cx="${cx}" cy="${cy}" r="${(coreR * 2.8).toFixed(1)}" fill="url(#glow)"/>

  <!-- 軌道ドット -->
  ${dotsSvg}

  <!-- コア本体 -->
  <circle cx="${cx}" cy="${cy}" r="${coreR.toFixed(1)}" fill="url(#core)"/>
</svg>`;
}

// ─── strip.png 生成（storeCard / coupon 用） ─────────────────────────────────

export async function generateStripImage(spotCount: number, scale: 1 | 2 | 3 = 2): Promise<Buffer> {
  const baseW = 375;
  const baseH = 123;  // strip の標準高さ
  const w = baseW * scale;
  const h = baseH * scale;

  const svg = buildStripSvg(w, h, spotCount);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── logo.png 生成（SPOT 赤ドット + テキスト） ──────────────────────────────

export async function generateLogoImage(scale: 1 | 2 | 3 = 2): Promise<Buffer> {
  const w = 160 * scale;
  const h = 50 * scale;
  const dotR = 8 * scale;
  const dotX = dotR + 2 * scale;
  const dotY = h / 2;
  const textX = dotX + dotR + 6 * scale;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="dot" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff4d3f"/>
      <stop offset="100%" stop-color="#e8261a"/>
    </radialGradient>
  </defs>
  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="url(#dot)"/>
  <text x="${textX}" y="${dotY + 5 * scale}" font-family="Arial, sans-serif" font-weight="bold"
    font-size="${18 * scale}" fill="white" letter-spacing="${3 * scale}">SPOT</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ─── icon.png 生成（通知アイコン用、赤ドットのみ） ───────────────────────────

export async function generateIconImage(scale: 1 | 2 | 3 = 2): Promise<Buffer> {
  const size = 29 * scale;
  const r = size / 2 - 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <radialGradient id="icon" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ff4d3f"/>
      <stop offset="100%" stop-color="#a01a11"/>
    </radialGradient>
  </defs>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="url(#icon)"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
