import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Route } from "next";

export type BreadcrumbItem = {
  label: string;
  href?: Route;
};

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink/52" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-ink/65 transition hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-semibold text-ink" : "text-ink/65"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
