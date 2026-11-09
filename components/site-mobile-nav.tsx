"use client";

import Link from "next/link";
import { Home, Search, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export function SiteMobileNav() {
  const path = usePathname();
  if (path.startsWith("/member-checkin") || path.includes("/checkin/")) return null;
  const items = [
    { href: "/", label: "ホーム", icon: Home, active: path === "/" },
    { href: "/spots", label: "探す", icon: Search, active: path.startsWith("/spots") },
    { href: "/account", label: "マイページ", icon: UserCircle, active: path.startsWith("/account") },
  ] as const;
  return <nav aria-label="メインメニュー" className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"><div className="mx-auto grid max-w-md grid-cols-3">{items.map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex h-16 flex-col items-center justify-center gap-1 ${active ? "text-moss" : "text-ink/60"}`}><Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 1.8} /><span className={`text-[10px] leading-none ${active ? "font-bold" : "font-medium"}`}>{label}</span></Link>)}</div></nav>;
}
