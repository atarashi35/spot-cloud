"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { listOwnerSpotsFromFirestore } from "@/lib/firestore/spots";
import type { Spot } from "@/lib/types";

export function OwnerSpotList() {
  const { authReady, user } = useAuth();
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!user) { setSpots(null); return; }
    let cancelled = false;
    void listOwnerSpotsFromFirestore(user.uid).then((items) => { if (!cancelled) setSpots(items); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [user]);
  if (!authReady) return <p className="text-sm text-ink/60">読み込み中です。</p>;
  if (!user) return <p className="text-sm text-ink/65">管理するにはログインしてください。</p>;
  if (error) return <p className="text-sm text-red-700">SPOTを読み込めませんでした。再読み込みしてください。</p>;
  if (!spots) return <p className="text-sm text-ink/60">読み込み中です。</p>;
  return <div className="space-y-8">
    {spots.length ? <ul className="divide-y divide-ink/10 border-y border-ink/10">{spots.map((spot) => <li key={spot.id}><Link href={`/manage/${spot.id}`} className="flex items-center justify-between gap-4 py-5 hover:text-moss"><span><span className="block font-bold">{spot.name}</span><span className="mt-1 block text-xs text-ink/60">{spot.kind === "creator" ? "クリエイター" : "団体"} · {spot.isSuspended ? "停止中" : spot.isPublished ? "公開中" : "非公開"}</span></span><span aria-hidden="true">›</span></Link></li>)}</ul> : <p className="text-sm text-ink/60">運営中のSPOTはまだありません。</p>}
    <div className="border-t border-ink/10 pt-5"><p className="text-sm font-semibold">新しく登録する</p><div className="mt-3 flex flex-wrap gap-3"><Link href="/owner/spots/new?kind=creator" className="cta-secondary text-sm">クリエイター</Link><Link href="/owner/spots/new?kind=organization" className="cta-secondary text-sm">団体</Link></div></div>
  </div>;
}
