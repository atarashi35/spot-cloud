"use client";

import { OptimizedImage } from "@/components/ui/optimized-image";

import Link from "next/link";
import { ArrowUpRight, Building2, CreditCard, Image as ImageIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { listUserFollows } from "@/lib/firestore/follows";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { listPublishedSpotsFromFirestore } from "@/lib/firestore/spots";
import type { PostAttachment } from "@/lib/types";
import { PollCard, type FeedPoll } from "@/components/account/poll-card";
import { OpportunityCard, type FeedOpportunity } from "@/components/account/opportunity-card";

type SupportedSpot = { id: string; name: string; coverImageUrl?: string };
type Post = { id: string; title: string; body: string; publishDate: string; masked: boolean; imageUrl?: string | null; attachments?: PostAttachment[] };
type News = Post & { spotId: string; spotName: string; spotImage?: string };

export function MemberHome({ user }: { user: User }) {
  const [spots, setSpots] = useState<SupportedSpot[] | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [polls, setPolls] = useState<FeedPoll[]>([]);
  const [opportunities, setOpportunities] = useState<FeedOpportunity[]>([]);
  const [error, setError] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSpots(null); setNews([]); setPolls([]); setOpportunities([]); setError(false); setNewsError(false); setNewsLoading(true);
    void (async () => {
      const [follows, memberships, token, published] = await Promise.all([
        listUserFollows(user), listUserMemberships(user.uid), user.getIdToken(), listPublishedSpotsFromFirestore(),
      ]);
      const byId = new Map<string, SupportedSpot>();
      for (const follow of follows) byId.set(follow.spotId, { id: follow.spotId, name: follow.spotName });
      for (const membership of memberships) {
        if (membership.status === "active" || membership.status === "canceling") {
          byId.set(membership.spotId, { id: membership.spotId, name: membership.spotName });
        }
      }
      const images = new Map(published.map((spot) => [spot.id, spot.coverImageUrl]));
      const supported = [...byId.values()].map((spot) => ({ ...spot, coverImageUrl: images.get(spot.id) }));
      if (!cancelled) setSpots(supported);
      async function loadBatches<T>(load: (spot: typeof published[number]) => Promise<T[]>) {
        const results: PromiseSettledResult<T[]>[] = [];
        for (let start = 0; start < published.length; start += 8) {
          if (cancelled) break;
          results.push(...await Promise.allSettled(published.slice(start, start + 8).map(load)));
        }
        return results;
      }
      const [results, pollResults, opportunityResults] = await Promise.all([
        loadBatches<News>(async (spot) => {
          const response = await fetch(`/api/spots/${encodeURIComponent(spot.id)}/feed`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) throw new Error("feed_unavailable");
          const data = await response.json() as { posts: Post[] };
          return data.posts.filter((post) => !post.masked && post.title).map((post) => ({ ...post, spotId: spot.id, spotName: spot.name, spotImage: spot.coverImageUrl }));
        }),
        loadBatches<FeedPoll>(async (spot) => {
          const response = await fetch(`/api/spots/${encodeURIComponent(spot.id)}/polls`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) throw new Error("polls_unavailable");
          const data = await response.json() as { polls: FeedPoll[] };
          return data.polls.map((poll) => ({ ...poll, spotId: spot.id, spotName: spot.name, spotImage: spot.coverImageUrl }));
        }),
        loadBatches<FeedOpportunity>(async (spot) => {
          const response = await fetch(`/api/spots/${encodeURIComponent(spot.id)}/opportunities`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) throw new Error("opportunities_unavailable");
          const data = await response.json() as { opportunities: FeedOpportunity[] };
          return data.opportunities.map((item) => ({ ...item, spotId: spot.id, spotName: spot.name, spotImage: spot.coverImageUrl }));
        }),
      ]);
      if (!cancelled) {
        setNews(results.flatMap((result) => result.status === "fulfilled" ? result.value : []).sort((a, b) => b.publishDate.localeCompare(a.publishDate)).slice(0, 10));
        setPolls(pollResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
        setOpportunities(opportunityResults.flatMap((result) => result.status === "fulfilled" ? result.value : []));
        setNewsError([...results, ...pollResults, ...opportunityResults].some((result) => result.status === "rejected"));
        setNewsLoading(false);
      }
    })().catch(() => { if (!cancelled) { setError(true); setNewsLoading(false); } });
    return () => { cancelled = true; };
  }, [user]);

  const feed = [...news.map((post) => ({ kind: "post" as const, date: post.publishDate, post })), ...polls.map((poll) => ({ kind: "poll" as const, date: poll.createdAt, poll })), ...opportunities.map((item) => ({ kind: "opportunity" as const, date: item.createdAt, item }))].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  return <div className="shell mx-auto max-w-2xl pb-24 pt-6 sm:pt-8">
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-ink">ホーム</h1>
      <div className="flex items-center gap-2">
        <Link href="/manage" aria-label="SPOTの運営・登録" title="SPOTの運営・登録" className="icon-button"><Building2 className="h-5 w-5" /></Link>
        <Link href="/account#member-card" className="cta-secondary"><CreditCard className="h-4 w-4" aria-hidden="true" />会員証</Link>
      </div>
    </div>

    {error ? <p className="mt-8 text-sm text-red-700">情報を読み込めませんでした。再読み込みしてください。</p> : !spots ? <p className="mt-8 text-sm text-ink/60">読み込み中です。</p> : <>
      {spots.length > 0 ? (
      <section className="mt-7" aria-label="サポート中のSPOT">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-ink/70">サポート中</h2><Link href="/spots" aria-label="SPOTを探す" className="flex h-10 w-10 items-center justify-center rounded-full text-ink/60 hover:bg-white hover:text-ink"><Search className="h-5 w-5" /></Link></div>
        <ul className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">{spots.map((spot) => <li key={spot.id} className="w-20 shrink-0"><Link href={`/spots/${spot.id}`} className="group flex flex-col items-center gap-2 text-center">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-ink/10">{spot.coverImageUrl ? <OptimizedImage src={spot.coverImageUrl} sizes="64px" width={128} height={128} className="h-full w-full object-cover" /> : <span className="text-lg font-bold text-ink/50">{spot.name.slice(0, 1)}</span>}</span>
          <span className="line-clamp-2 w-full text-xs font-semibold leading-4 group-hover:text-moss">{spot.name}</span>
        </Link></li>)}</ul>
      </section>
      ) : null}
      <section className="mt-7" aria-label="SPOTの投稿">
        <h2 className="mb-4 text-lg font-bold">フィード</h2>
        {newsError ? <p className="mb-4 text-sm text-red-700">一部の投稿を読み込めませんでした。</p> : null}
        {newsLoading ? <p className="py-5 text-sm text-ink/60">読み込み中です。</p> : feed.length ? <div className="space-y-4">{feed.map((item) => {
          if (item.kind === "poll") return <PollCard key={`${item.poll.spotId}-${item.poll.id}`} poll={item.poll} user={user} />;
          if (item.kind === "opportunity") return <OpportunityCard key={`${item.item.spotId}-${item.item.id}`} item={item.item} user={user} />;
          const post = item.post;
          const image = post.attachments?.find((attachment) => attachment.type === "image")?.url || post.imageUrl;
          return <article key={`${post.spotId}-${post.id}`} className="overflow-hidden rounded-2xl bg-white">
            <Link href={`/spots/${post.spotId}`} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist">{post.spotImage ? <OptimizedImage src={post.spotImage} sizes="40px" width={80} height={80} className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-ink/50">{post.spotName.slice(0, 1)}</span>}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{post.spotName}</span><span className="block text-xs text-ink/55">{post.publishDate ? post.publishDate.slice(0, 10).replace(/-/g, "/") : ""}</span></span>
            </Link>
            <Link href={`/spots/${post.spotId}/posts/${post.id}`} className="block">
              {image ? <OptimizedImage src={image} sizes="(max-width: 640px) 100vw, 640px" className="max-h-[520px] w-full bg-mist object-cover" /> : null}
              <div className="px-4 pb-5 pt-3"><h3 className="font-bold text-ink">{post.title}</h3>{post.body ? <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-6 text-ink/65">{post.body}</p> : null}<span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ink/60">続きを読む <ArrowUpRight className="h-3.5 w-3.5" /></span></div>
            </Link>
          </article>;
        })}</div> : !newsError ? <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center"><ImageIcon className="h-7 w-7 text-ink/30" aria-hidden="true" /><p className="mt-3 text-sm text-ink/60">投稿はまだありません</p></div> : null}
      </section>
    </>}
  </div>;
}
