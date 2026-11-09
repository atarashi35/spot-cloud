"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LogoAnimation } from "@/components/ui/logo-animation";

export function VisitorHome() {
  return <div className="shell mx-auto max-w-5xl pb-12 pt-6 sm:pt-10">
    <section className="relative overflow-hidden rounded-[28px] bg-ink px-6 pb-8 pt-8 text-white sm:px-12 sm:py-14">
      <div className="relative z-10 max-w-md">
        <p className="text-xs font-semibold tracking-[0.16em] text-white/60">SPOT</p>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">活動に、<br />サポーターを。</h1>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/owner" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-ink transition hover:bg-white/90">SPOTを作る <ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/spots" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10">SPOTを探す</Link>
        </div>
      </div>
      <LogoAnimation className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-60 sm:right-8 sm:top-1/2 sm:h-72 sm:w-72 sm:-translate-y-1/2 sm:opacity-80" />
    </section>
    <Link href="/for-owners" className="mt-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink/65 hover:text-ink">仕組みと料金 <ArrowUpRight className="h-4 w-4" /></Link>
  </div>;
}
