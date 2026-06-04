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

        <style>{`
          /* ── 中心赤ドット：ダブルパルス ── */
          .lm-center {
            animation: lm-center-pulse 1.8s cubic-bezier(0.45,0,0.55,1) infinite;
            transform-origin: ${CX}px ${CY}px;
          }
          @keyframes lm-center-pulse {
            0%,100% { transform: scale(1);    filter: brightness(1); }
            30%      { transform: scale(1.35); filter: brightness(1.6); }
            60%      { transform: scale(0.92); filter: brightness(0.9); }
            80%      { transform: scale(1.15); filter: brightness(1.3); }
          }

          /* ── パルスリング1 ── */
          .lm-ring1 {
            transform-origin: ${CX}px ${CY}px;
            fill: none;
            stroke: #e8261a;
            stroke-width: 1;
            animation: lm-ring-out 1.8s ease-out infinite;
          }
          /* ── パルスリング2（位相ずれ） ── */
          .lm-ring2 {
            transform-origin: ${CX}px ${CY}px;
            fill: none;
            stroke: #e8261a;
            stroke-width: 0.6;
            animation: lm-ring-out 1.8s ease-out 0.6s infinite;
          }
          @keyframes lm-ring-out {
            0%   { transform: scale(0.5); opacity: 0.9; }
            100% { transform: scale(3.2); opacity: 0; }
          }

          /* ── 内周グループ：反時計回り ── */
          .lm-inner-group {
            transform-origin: ${CX}px ${CY}px;
            animation: lm-rotate-ccw 12s linear infinite;
          }
          @keyframes lm-rotate-ccw {
            from { transform: rotate(0deg); }
            to   { transform: rotate(-360deg); }
          }

          /* ── 外周グループ：時計回り（ゆっくり） ── */
          .lm-outer-group {
            transform-origin: ${CX}px ${CY}px;
            animation: lm-rotate-cw 22s linear infinite;
          }
          @keyframes lm-rotate-cw {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }

          /* ── 接続線グループ（内周と逆回転で線を固定位置に見せる） ── */
          .lm-line-group {
            transform-origin: ${CX}px ${CY}px;
            animation: lm-rotate-ccw 12s linear infinite;
          }

          /* ── 個々の内周ドット：スタッガー点滅 ── */
          .lm-idot {
            animation: lm-dot-flash 2.4s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          @keyframes lm-dot-flash {
            0%,100% { opacity: 0.75; transform: scale(1); }
            50%      { opacity: 1;    transform: scale(1.25); filter: brightness(1.5); }
          }

          /* ── 外周ドット：逆位相でスタッガー ── */
          .lm-odot {
            animation: lm-odot-pulse 3.2s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          @keyframes lm-odot-pulse {
            0%,100% { opacity: 0.2; transform: scale(0.8); }
            50%      { opacity: 0.7; transform: scale(1.3); }
          }

          /* ── 内周同士の接続線：ストローク描画 ── */
          .lm-inner-line {
            stroke: rgba(255,255,255,0.18);
            stroke-width: 0.5;
            fill: none;
            stroke-dasharray: 30;
            animation: lm-line-flow 2.4s linear infinite;
          }
          @keyframes lm-line-flow {
            from { stroke-dashoffset: 30; }
            to   { stroke-dashoffset: -30; }
          }

          /* ── 中心→内周の放射線：フェードイン/アウト ── */
          .lm-radial-line {
            stroke: rgba(232,38,26,0.25);
            stroke-width: 0.5;
            fill: none;
            animation: lm-radial-pulse 1.8s ease-in-out infinite;
          }
          @keyframes lm-radial-pulse {
            0%,100% { opacity: 0.15; }
            50%      { opacity: 0.6; }
          }

          /* ── フレアディスク：ゆっくり回転 ── */
          .lm-flare {
            transform-origin: ${CX}px ${CY}px;
            animation: lm-flare-spin 6s linear infinite;
          }
          @keyframes lm-flare-spin {
            from { transform: rotate(0deg) scaleX(1); opacity: 0.6; }
            50%  { transform: rotate(180deg) scaleX(1.4); opacity: 1; }
            to   { transform: rotate(360deg) scaleX(1); opacity: 0.6; }
          }

          /* ── 全体呼吸：ゆっくりスケール ── */
          .lm-root {
            transform-origin: ${CX}px ${CY}px;
            animation: lm-global-breathe 5s ease-in-out infinite;
          }
          @keyframes lm-global-breathe {
            0%,100% { transform: scale(1); }
            50%      { transform: scale(1.06); }
          }

          /* ── パーティクル ── */
          .lm-particle {
            animation: lm-particle-fly 2.8s ease-out infinite;
            transform-box: fill-box;
            transform-origin: center;
          }
          @keyframes lm-particle-fly {
            0%   { transform: scale(1) translate(0,0); opacity: 0.9; }
            100% { transform: scale(0) translate(var(--px), var(--py)); opacity: 0; }
          }
        `}</style>
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
