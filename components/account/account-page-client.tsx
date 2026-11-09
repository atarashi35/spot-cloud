"use client";

import { OptimizedImage } from "@/components/ui/optimized-image";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { SocioCard } from "@/components/account/socio-card";
import { MemberQr } from "@/components/account/member-qr";
import { ActivityPassport } from "@/components/account/activity-passport";
import { listUserFollows } from "@/lib/firestore/follows";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { getUserProfileDoc } from "@/lib/firestore/user-profile";
import { listOwnerSpotsFromFirestore } from "@/lib/firestore/spots";
import { resolveDisplayName } from "@/lib/user-profile";
import type { Spot, UserFollow, UserMembership } from "@/lib/types";

export function AccountPageClient() {
  const { authReady, user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [follows, setFollows] = useState<UserFollow[]>([]);
  const [profile, setProfile] = useState<{ name: string | null; avatar: string | null; since: string | null }>({ name: null, avatar: null, since: null });
  const [numbers, setNumbers] = useState<Record<string, number | null>>({});
  const [error, setError] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [ownedSpots, setOwnedSpots] = useState<Spot[] | null>(null);
  const [ownedError, setOwnedError] = useState(false);

  useEffect(() => {
    if (!user) { setMemberships(null); setFollows([]); return; }
    let cancelled = false;
    setError(false); setMemberships(null); setFollows([]); setNumbers({});
    setProfile({ name: null, avatar: null, since: null });
    void (async () => {
      const token = await user.getIdToken();
      const claim = fetch("/api/auth/claim-memberships", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).then(async (response) => response.ok ? await response.json() as { reconciledCount?: number; repairedCount?: number } : null).catch(() => null);
      const [initialPaid, free] = await Promise.all([listUserMemberships(user.uid), listUserFollows(user)]);
      if (cancelled) return;
      setMemberships(initialPaid); setFollows(free);
      const result = await claim;
      const paid = result && ((result.reconciledCount ?? 0) > 0 || (result.repairedCount ?? 0) > 0) ? await listUserMemberships(user.uid) : initialPaid;
      if (cancelled) return;
      setMemberships(paid);
      const active = paid.filter((m) => m.status === "active" || m.status === "canceling");
      const entries = await Promise.all(active.map((m) => fetch(`/api/spots/${m.spotId}/socio-number`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() as Promise<{ number: number | null }> : { number: null }).then((data) => [m.spotId, data.number] as const).catch(() => [m.spotId, null] as const)));
      if (!cancelled) setNumbers(Object.fromEntries(entries));
    })().catch(() => { if (!cancelled) setError(true); });
    void getUserProfileDoc(user.uid).then((data) => { if (!cancelled) setProfile({ name: data?.profileDisplayName ?? null, avatar: data?.avatarUrl ?? null, since: data?.joinedAt ?? user.metadata.creationTime ?? null }); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || user.isAnonymous) { setOwnedSpots(null); setOwnedError(false); return; }
    let cancelled = false;
    setOwnedSpots(null); setOwnedError(false);
    void listOwnerSpotsFromFirestore(user.uid).then((spots) => { if (!cancelled) setOwnedSpots(spots); }).catch(() => { if (!cancelled) setOwnedError(true); });
    return () => { cancelled = true; };
  }, [user]);

  if (!authReady) return <p className="text-sm text-ink/60">読み込み中です。</p>;
  if (!user) return <div className="space-y-4"><EmptyState title="ログインしてください" description="会員証やサポート中のSPOTを確認できます。" /><button type="button" className="cta-primary" onClick={() => setLoginOpen(true)}>ログイン・会員登録</button><LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} returnTo="/account" /></div>;
  if (error) return <EmptyState title="サポート情報を取得できませんでした" description="再読み込みしてください。" />;
  if (!memberships) return <p className="text-sm text-ink/60">読み込み中です。</p>;

  const paid = memberships.filter((m) => m.status !== "canceled");
  const paidIds = new Set(paid.map((m) => m.spotId));
  const free = follows.filter((f) => !paidIds.has(f.spotId));

  return <div className="space-y-8">
    <section aria-labelledby="owned-spots-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="owned-spots-heading" className="text-lg font-bold text-ink">運営中のSPOT</h2>
        {ownedSpots && ownedSpots.length > 0 ? <Link href="/owner" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink/65 hover:text-ink"><Plus className="h-4 w-4" aria-hidden="true" />登録</Link> : null}
      </div>
      {ownedError ? <div className="rounded-2xl bg-white px-4 py-4"><p className="text-sm text-red-700">SPOTを読み込めませんでした。</p><Link href="/manage" className="mt-2 inline-block text-sm font-semibold text-moss">管理画面を開く →</Link></div> : !ownedSpots ? <p className="py-4 text-sm text-ink/60">読み込み中です。</p> : ownedSpots.length ? <>
        <ul className="divide-y divide-ink/8 overflow-hidden rounded-2xl bg-white">{ownedSpots.slice(0, 3).map((spot) => <li key={spot.id}><Link href={`/manage/${spot.id}`} className="flex min-h-20 items-center gap-3 px-4 py-3 hover:bg-mist">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mist">{spot.coverImageUrl ? <OptimizedImage src={spot.coverImageUrl} sizes="64px" width={128} height={128} className="h-full w-full object-cover" /> : <span className="text-base font-bold text-ink/50">{spot.name.slice(0, 1)}</span>}</span>
          <span className="min-w-0 flex-1"><span className="block truncate font-bold text-ink">{spot.name}</span><span className="mt-1 block text-xs text-ink/60">{spot.kind === "creator" ? "クリエイター" : "団体"} · {spot.isSuspended ? "停止中" : spot.isPublished ? "公開中" : "非公開"}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" />
        </Link></li>)}</ul>
        {ownedSpots.length > 3 ? <Link href="/manage" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-ink/65 hover:text-ink">すべて見る →</Link> : null}
      </> : <Link href="/owner" className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-white px-4 text-sm font-semibold text-ink hover:bg-mist"><span>クリエイター・団体を登録</span><ArrowRight className="h-4 w-4 shrink-0 text-ink/45" aria-hidden="true" /></Link>}
    </section>
    <section id="member-card" className="scroll-mt-28 space-y-3">
      <h2 className="text-sm font-bold text-ink/72">SPOT会員証</h2>
      <div className="mx-auto max-w-sm space-y-3">
        <SocioCard uid={user.uid} displayName={resolveDisplayName(profile.name, user.displayName, user.email)} avatarUrl={profile.avatar} memberSince={profile.since} memberships={memberships} follows={follows} memberNumbers={numbers} compactActions />
        <MemberQr user={user} />
      </div>
    </section>
    <section>
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3"><h2 className="text-lg font-bold">サポート中のSPOT</h2><Link href="/spots" className="text-sm font-semibold text-moss">探す</Link></div>
      {free.length === 0 && paid.length === 0 ? <p className="py-5 text-sm text-ink/60">サポート中のSPOTはまだありません。</p> : <ul className="divide-y divide-ink/8">
        {free.map((follow) => <li key={follow.spotId}><Link href={`/spots/${follow.spotId}`} className="flex items-center justify-between gap-4 py-4 hover:text-moss"><span className="font-semibold">{follow.spotName}</span><span className="shrink-0 text-xs text-ink/60">無料 ›</span></Link></li>)}
        {paid.map((membership) => <li key={membership.spotId}><Link href={`/spots/${membership.spotId}`} className="flex items-center justify-between gap-4 py-4 hover:text-moss"><span className="font-semibold">{membership.spotName}</span><span className="shrink-0 text-xs text-ink/60">月額{membership.status === "past_due" ? "・支払い確認待ち" : membership.status === "canceling" ? "・解約予定" : ""} ›</span></Link></li>)}
      </ul>}
    </section>
    <details className="border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold text-ink">活動・サポーター履歴</summary><div className="mt-4"><ActivityPassport user={user} /></div></details>
    <Link href="/settings" className="inline-block text-sm font-semibold text-ink/65 hover:text-ink">設定 →</Link>
  </div>;
}
