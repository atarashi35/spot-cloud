import { ImageResponse } from "next/og";

export const runtime = "edge";

// Google Wallet GenericPass 推奨ヒーロー画像サイズ
const W = 1032;
const H = 336;

// 軌道ドット（静止フレーム）
const RINGS = [
  { radius: 90,  count: 3 },
  { radius: 130, count: 5 },
  { radius: 170, count: 7 },
  { radius: 210, count: 9 },
];

function orbitDots() {
  const dots: { x: number; y: number; size: number; opacity: number }[] = [];
  RINGS.forEach(({ radius, count }, ri) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + ri * 0.7;
      dots.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        size: 3.5 - ri * 0.4,
        opacity: 0.65 - ri * 0.1,
      });
    }
  });
  return dots;
}

const dots = orbitDots();

// カード右側の中心座標（コア＋軌道の中心）
const CX = W * 0.72;
const CY = H / 2;

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: "linear-gradient(135deg, #111111 0%, #1a1a1a 45%, #0d0d0d 100%)",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* 軌道ドット */}
        {dots.map((d, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: d.size,
              height: d.size,
              borderRadius: "50%",
              background: `rgba(255,255,255,${d.opacity})`,
              left: CX + d.x - d.size / 2,
              top: CY + d.y - d.size / 2,
            }}
          />
        ))}

        {/* 赤コア */}
        <div
          style={{
            position: "absolute",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff4d3f, #e8261a 60%, #a01a11)",
            boxShadow: "0 0 28px rgba(232,38,26,0.75), 0 0 56px rgba(232,38,26,0.35)",
            left: CX - 14,
            top: CY - 14,
          }}
        />

        {/* グレア */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.04), transparent 60%)",
          }}
        />

        {/* 左：コンテンツ */}
        <div
          style={{
            position: "absolute",
            left: 52,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {/* SPOT ブランド */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#e8261a",
                boxShadow: "0 0 8px rgba(232,38,26,0.7)",
              }}
            />
            <span
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.22em",
              }}
            >
              SPOT
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.25em",
                marginLeft: 4,
              }}
            >
              SOCIO
            </span>
          </div>

          {/* 区切り線 */}
          <div
            style={{
              width: 180,
              height: 1,
              background: "rgba(255,255,255,0.1)",
              marginTop: 18,
              marginBottom: 18,
            }}
          />

          {/* キャッチコピー */}
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.08em",
              lineHeight: 1.6,
            }}
          >
            好きな場所に参加するための証明
          </span>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
