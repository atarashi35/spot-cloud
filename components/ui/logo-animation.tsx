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

// 内周ドット間の接続（隣接ペア）
const INNER_LINES = INNER.map((d, i) => ({ a: d, b: INNER[(i + 1) % INNER.length] }));

export function LogoAnimation({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 104 100" className={className} aria-hidden="true">
      <defs>
        {/* グロー：赤 */}
        <filter id="glow-red" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="5" result="b1" />
          <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="b2" />
          <feMerge><feMergeNode in="b1" /><feMergeNode in="b2" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* グロー：白 */}
        <filter id="glow-white" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* 全体ぼかし */}
        <filter id="soft-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>

        {/* グラデーション：回転するレンズフレア */}
        <radialGradient id="flare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8261a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e8261a" stopOpacity="0" />
        </radialGradient>

      </defs>

      {/* ── 全体をゆっくり呼吸させる ── */}
      <g className="lm-root">

        {/* フレアディスク */}
        <ellipse cx={CX} cy={CY} rx={18} ry={12} fill="url(#flare)" className="lm-flare" />

        {/* 中心→内周の放射線（静止） */}
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

        {/* 内周接続線グループ（内周と同じ回転） */}
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
              filter="url(#glow-white)"
              className="lm-idot"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
          ))}
        </g>

        {/* パルスリング */}
        <circle cx={CX} cy={CY} r={8} className="lm-ring1" />
        <circle cx={CX} cy={CY} r={8} className="lm-ring2" />

        {/* パーティクル（中心から四方へ）*/}
        {[
          { px: "0px", py: "-18px", delay: "0s" },
          { px: "16px", py: "-10px", delay: "0.45s" },
          { px: "16px", py: "10px", delay: "0.9s" },
          { px: "0px", py: "18px", delay: "1.35s" },
          { px: "-16px", py: "10px", delay: "1.8s" },
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

        {/* 中心赤ドット */}
        <circle
          cx={CX} cy={CY} r={7.5}
          fill="#e8261a"
          filter="url(#glow-red)"
          className="lm-center"
        />
      </g>
    </svg>
  );
}
