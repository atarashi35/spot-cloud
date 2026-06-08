"use client";

const CX = 52, CY = 50;

const INNER = [
  { cx: 69, cy: 50 },
  { cx: 61, cy: 65 },
  { cx: 44, cy: 65 },
  { cx: 35, cy: 50 },
  { cx: 44, cy: 35 },
  { cx: 61, cy: 35 },
];

const OUTER = [
  { cx: 86, cy: 50 },
  { cx: 82, cy: 67 },
  { cx: 69, cy: 80 },
  { cx: 52, cy: 85 },
  { cx: 35, cy: 80 },
  { cx: 22, cy: 67 },
  { cx: 18, cy: 50 },
  { cx: 22, cy: 33 },
  { cx: 35, cy: 20 },
  { cx: 52, cy: 16 },
  { cx: 69, cy: 20 },
  { cx: 82, cy: 33 },
];

const INNER_LINES = INNER.map((d, i) => ({ a: d, b: INNER[(i + 1) % INNER.length] }));

export function LogoAnimation({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 104 100" className={className} aria-hidden="true">
      <defs>
        {/* グラデーション：レンズフレア */}
        <radialGradient id="flare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8261a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e8261a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 全体ゆっくり呼吸 */}
      <g className="lm-root">

        {/* フレアディスク */}
        <ellipse cx={CX} cy={CY} rx={18} ry={12} fill="url(#flare)" className="lm-flare" />

        {/* 中心→内周の放射線 */}
        {INNER.map((d, i) => (
          <line key={`rad-${i}`}
            x1={CX} y1={CY} x2={d.cx} y2={d.cy}
            className="lm-radial-line"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

        {/* 外周グループ（時計回り） */}
        <g className="lm-outer-group">
          {OUTER.map((d, i) => (
            <circle key={`o-${i}`}
              cx={d.cx} cy={d.cy} r={3.2}
              fill="rgba(255,255,255,0.3)"
              className="lm-odot"
              style={{ animationDelay: `${i * 0.27}s` }}
            />
          ))}
        </g>

        {/* 内周接続線グループ */}
        <g className="lm-line-group">
          {INNER_LINES.map((l, i) => (
            <line key={`il-${i}`}
              x1={l.a.cx} y1={l.a.cy} x2={l.b.cx} y2={l.b.cy}
              className="lm-inner-line"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>

        {/* 内周グループ（反時計回り） */}
        <g className="lm-inner-group">
          {INNER.map((d, i) => (
            <circle key={`in-${i}`}
              cx={d.cx} cy={d.cy} r={5.5}
              fill="rgba(255,255,255,0.88)"
              className="lm-idot"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>

        {/* パルスリング */}
        <circle cx={CX} cy={CY} r={8} className="lm-ring1" />
        <circle cx={CX} cy={CY} r={8} className="lm-ring2" />

        {/* パーティクル */}
        {[
          { px: "0px",   py: "-18px", delay: "0s" },
          { px: "16px",  py: "-10px", delay: "0.45s" },
          { px: "16px",  py: "10px",  delay: "0.9s" },
          { px: "0px",   py: "18px",  delay: "1.35s" },
          { px: "-16px", py: "10px",  delay: "1.8s" },
          { px: "-16px", py: "-10px", delay: "2.25s" },
        ].map((p, i) => (
          <circle key={`p-${i}`}
            cx={CX} cy={CY} r={2.2}
            fill="#e8261a"
            className="lm-particle"
            style={{
              ["--px" as string]: p.px,
              ["--py" as string]: p.py,
              animationDelay: p.delay,
            }}
          />
        ))}

        {/* 中心赤ドット（グローはopacityで表現） */}
        <circle cx={CX} cy={CY} r={10} fill="#e8261a" opacity="0.2" className="lm-center-glow" />
        <circle cx={CX} cy={CY} r={7.5} fill="#e8261a" className="lm-center" />
      </g>
    </svg>
  );
}
