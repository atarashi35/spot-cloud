import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden bg-ink px-6 py-12 sm:px-8 sm:py-16">
      {/* グリッド背景 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto max-w-3xl">
        {eyebrow && (
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold tracking-[0.2em] text-white/50">
            {eyebrow}
          </div>
        )}
        <h1 className={`font-bold leading-tight tracking-tight text-white/90 ${eyebrow ? "mt-4" : ""} text-3xl sm:text-4xl`}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm leading-7 text-white/55">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
