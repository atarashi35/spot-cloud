import { ReactNode } from "react";

export function PageShell({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`shell ${className}`.trim()}>{children}</div>;
}
