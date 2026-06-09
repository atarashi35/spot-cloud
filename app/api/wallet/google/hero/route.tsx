import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const W = 1032;
const H = 336;

const RINGS = [
  { radius: 70,  count: 4 },
  { radius: 105, count: 6 },
  { radius: 140, count: 8 },
  { radius: 175, count: 10 },
];

type Dot = { x: number; y: number; size: number; opacity: number };

function buildDots(): Dot[] {
  const result: Dot[] = [];
  RINGS.forEach(({ radius, count }, ri) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + ri * 0.65;
      result.push({
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
        size: [4, 3.5, 3, 2.5][ri],
        opacity: [0.70, 0.55, 0.42, 0.30][ri],
      });
    }
  });
  return result;
}

const DOTS = buildDots();
const CX = Math.round(W * 0.70);
const CY = Math.round(H * 0.50);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const displayName = searchParams.get("name") ?? "SOCIO";
  const spotCount = searchParams.get("spots") ?? "0";

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          background: "linear-gradient(135deg, #111111 0%, #1a1a1a 40%, #0d0d0d 100%)",
          position: "relative",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* グレア */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.05) 0%, transparent 55%)",
          display: "flex",
        }} />

        {/* 軌道ドット */}
        {DOTS.map((d, i) => (
          <div key={i} style={{
            position: "absolute",
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: `rgba(255,255,255,${d.opacity})`,
            left: CX + d.x - d.size / 2,
            top: CY + d.y - d.size / 2,
            display: "flex",
          }} />
        ))}

        {/* 赤コア */}
        <div style={{
          position: "absolute",
          width: 22, height: 22,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #ff4d3f, #e8261a 60%, #a01a11)",
          boxShadow: "0 0 20px rgba(232,38,26,0.65), 0 0 44px rgba(232,38,26,0.28)",
          left: CX - 11, top: CY - 11,
          display: "flex",
        }} />

        {/* カード本文 */}
        <div style={{
          position: "absolute",
          top: 40, left: 56, right: 56, bottom: 40,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>

          {/* 上段: ● SPOT ／ SOCIO */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: "#e8261a",
                boxShadow: "0 0 8px rgba(232,38,26,0.7)",
                display: "flex",
              }} />
              <span style={{ color: "white", fontSize: 22, fontWeight: 700, letterSpacing: "0.22em", fontFamily: "sans-serif" }}>
                SPOT
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: 600, letterSpacing: "0.28em", fontFamily: "sans-serif" }}>
              SOCIO
            </span>
          </div>

          {/* 下段: SPOTS数＋名前 ／ QR */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>

            {/* 左: SPOTS数 + 名前 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
                <span style={{ color: "white", fontSize: 72, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em", fontFamily: "sans-serif" }}>
                  {spotCount}
                </span>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, fontWeight: 600, letterSpacing: "0.18em", marginLeft: 12, marginBottom: 10, fontFamily: "sans-serif" }}>
                  SPOTS
                </span>
              </div>
              {/* 名前行 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                }} />
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: 600, letterSpacing: "0.04em", fontFamily: "sans-serif" }}>
                  {displayName}
                </span>
              </div>
            </div>

            {/* 右: QRコード（白い正方形） */}
            <div style={{
              width: 80, height: 80,
              background: "white",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ position: "relative", width: 60, height: 60, display: "flex" }}>
                {/* 左上 */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 18, height: 18, border: "3px solid #111", borderRadius: 3, display: "flex" }}>
                  <div style={{ position: "absolute", top: 3, left: 3, width: 6, height: 6, background: "#111", borderRadius: 1, display: "flex" }} />
                </div>
                {/* 右上 */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, border: "3px solid #111", borderRadius: 3, display: "flex" }}>
                  <div style={{ position: "absolute", top: 3, left: 3, width: 6, height: 6, background: "#111", borderRadius: 1, display: "flex" }} />
                </div>
                {/* 左下 */}
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 18, height: 18, border: "3px solid #111", borderRadius: 3, display: "flex" }}>
                  <div style={{ position: "absolute", top: 3, left: 3, width: 6, height: 6, background: "#111", borderRadius: 1, display: "flex" }} />
                </div>
                {/* 中央ドット群 */}
                {[14,22,30,38,46].map((x) =>
                  [14,22,30,38,46].map((y) =>
                    (x > 20 || y > 20) && !(x > 40 && y < 24) ? (
                      <div key={`${x}-${y}`} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, background: (x + y) % 9 > 4 ? "#111" : "transparent", borderRadius: 1, display: "flex" }} />
                    ) : null
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
