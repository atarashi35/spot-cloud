"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoAnimation } from "@/components/ui/logo-animation";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import type { Spot } from "@/lib/types";

export function VisitorHome() {
  const [spots, setSpots] = useState<Spot[]>([]);
  useEffect(() => { let cancelled = false; void listPublishedSpotsFromFirestore().then((items) => { if (!cancelled) setSpots(items.filter((spot) => spot.coverImageUrl).slice(0, 3)); }).catch(() => {}); return () => { cancelled = true; }; }, []);
  return <div className="shell mx-auto max-w-5xl pb-12 pt-6 sm:pt-10">
    <section className="relative overflow-hidden rounded-[28px] bg-ink px-6 pb-8 pt-8 text-white sm:px-12 sm:py-14">
      <div className="relative z-10 max-w-md">
        <p className="text-xs font-semibold tracking-[0.16em] text-white/60">SPOT</p>
        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">活動に、<br />サポーターを。</h1>
        <p className="mt-4 max-w-xs text-sm leading-7 text-white/70">好きな活動とつながる。<br />無料でも、月額でも。</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/owner" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-ink transition hover:bg-white/90">SPOTを作る <ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/for-owners" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-5 text-sm font-semibold text-white transition hover:bg-white/10">仕組みと料金</Link>
        </div>
      </div>
      <LogoAnimation className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-60 sm:right-8 sm:top-1/2 sm:h-72 sm:w-72 sm:-translate-y-1/2 sm:opacity-80" />
    </section>
    {spots.length ? <section className="mt-12"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-ink">活動を見つける</h2><Link href="/spots" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink/65 hover:text-ink">すべて見る <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">{spots.map((spot) => <Link key={spot.id} href={`/spots/${spot.id}`} className="group min-w-0"><div className="aspect-[4/3] overflow-hidden rounded-2xl bg-mist"><img src={spot.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" /></div><p className="mt-2 truncate text-sm font-bold group-hover:text-moss">{spot.name}</p><p className="mt-1 text-xs text-ink/60">{spot.kind === "creator" ? "クリエイター" : "団体"}</p></Link>)}</div></section> : <Link href="/spots" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink/65">SPOTを探す <ArrowRight className="h-4 w-4" /></Link>}
  </div>;
}
