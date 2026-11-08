"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { listUserFollows } from "@/lib/firestore/follows";
import { listUserMemberships } from "@/lib/firestore/memberships";

type SupportedSpot = { id: string; name: string; label: string };
type Post = { id: string; title: string; publishDate: string; masked: boolean };
type News = Post & { spotId: string; spotName: string };

export function MemberHome({ user }: { user: User }) {
  const [spots, setSpots] = useState<SupportedSpot[] | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [error, setError] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSpots(null); setNews([]); setError(false); setNewsError(false); setNewsLoading(true);
    void (async () => {
      const [follows, memberships, token] = await Promise.all([
        listUserFollows(user), listUserMemberships(user.uid), user.getIdToken(),
      ]);
      const byId = new Map<string, SupportedSpot>();
      for (const follow of follows) byId.set(follow.spotId, { id: follow.spotId, name: follow.spotName, label: "無料" });
      for (const membership of memberships) {
        if (membership.status === "active" || membership.status === "canceling") {
          byId.set(membership.spotId, { id: membership.spotId, name: membership.spotName, label: "月額" });
        }
      }
      const supported = [...byId.values()];
      if (!cancelled) setSpots(supported);
      const results = await Promise.allSettled(supported.map(async (spot) => {
        const response = await fetch(`/api/spots/${encodeURIComponent(spot.id)}/feed`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error("feed_unavailable");
        const data = await response.json() as { posts: Post[] };
        return data.posts.filter((post) => !post.masked && post.title).map((post) => ({ ...post, spotId: spot.id, spotName: spot.name }));
      }));
      if (!cancelled) {
        setNews(results.flatMap((result) => result.status === "fulfilled" ? result.value : []).sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, 10));
        setNewsError(results.some((result) => result.status === "rejected"));
        setNewsLoading(false);
      }
    })().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [user]);

  return <div className="shell mx-auto max-w-4xl space-y-10 pb-20 pt-8">
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-ink">ホーム</h1>
      <Link href="/account#member-card" className="cta-secondary text-sm">会員証</Link>
    </div>
    {error ? <p className="text-sm text-red-700">サポート情報を読み込めませんでした。再読み込みしてください。</p> : !spots ? <p className="text-sm text-ink/60">読み込み中です。</p> : spots.length === 0 ? (
      <section className="border-t border-ink/10 py-6">
        <h2 className="text-lg font-bold">気になるSPOTを見つける</h2>
        <p className="mt-2 text-sm text-ink/65">クリエイターや団体を探して、サポーターになれます。</p>
        <Link href="/spots" className="cta-primary mt-5">SPOTを探す</Link>
      </section>
    ) : <>
      <section>
        <h2 className="border-b border-ink/10 pb-3 text-lg font-bold">お知らせ</h2>
        {newsError ? <p className="mt-4 text-sm text-red-700">一部のお知らせを読み込めませんでした。</p> : null}
        {newsLoading ? <p className="py-5 text-sm text-ink/60">読み込み中です。</p> : news.length ? <ul className="divide-y divide-ink/8">{news.map((post) => <li key={`${post.spotId}-${post.id}`}>
          <Link href={`/spots/${post.spotId}/posts/${post.id}`} className="block py-4 hover:text-moss">
            <p className="text-xs text-ink/60">{post.spotName} {post.publishDate ? `・${post.publishDate.slice(0, 10).replace(/-/g, "/")}` : ""}</p>
            <p className="mt-1 font-semibold">{post.title}</p>
          </Link>
        </li>)}</ul> : !newsError ? <p className="py-5 text-sm text-ink/60">お知らせはまだありません。</p> : null}
      </section>
      <section>
        <h2 className="border-b border-ink/10 pb-3 text-lg font-bold">サポート中のSPOT</h2>
        <ul className="divide-y divide-ink/8">{spots.map((spot) => <li key={spot.id}>
          <Link href={`/spots/${spot.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-moss"><span className="font-semibold">{spot.name}</span><span className="text-xs text-ink/60">{spot.label} ›</span></Link>
        </li>)}</ul>
        <Link href="/spots" className="mt-4 inline-block text-sm font-semibold text-moss">ほかのSPOTを探す →</Link>
      </section>
    </>}
  </div>;
}
