"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LoginModal } from "@/components/auth/login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { SocioCard } from "@/components/account/socio-card";
import { MemberQr } from "@/components/account/member-qr";
import { ActivityPassport } from "@/components/account/activity-passport";
import { listUserFollows } from "@/lib/firestore/follows";
import { listUserMemberships } from "@/lib/firestore/memberships";
import { getUserProfileDoc } from "@/lib/firestore/user-profile";
import { resolveDisplayName } from "@/lib/user-profile";
import type { UserFollow, UserMembership } from "@/lib/types";

export function AccountPageClient() {
  const { authReady, user } = useAuth();
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null);
  const [follows, setFollows] = useState<UserFollow[]>([]);
  const [profile, setProfile] = useState<{ name: string | null; avatar: string | null; since: string | null }>({ name: null, avatar: null, since: null });
  const [numbers, setNumbers] = useState<Record<string, number | null>>({});
  const [error, setError] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (!user) { setMemberships(null); setFollows([]); return; }
    let cancelled = false;
    setError(false); setMemberships(null); setFollows([]); setNumbers({});
    setProfile({ name: null, avatar: null, since: null });
    void (async () => {
      const token = await user.getIdToken();
      await fetch("/api/auth/claim-memberships", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      const [paid, free] = await Promise.all([listUserMemberships(user.uid), listUserFollows(user)]);
      if (cancelled) return;
      setMemberships(paid); setFollows(free);
      const active = paid.filter((m) => m.status === "active" || m.status === "canceling");
      const entries = await Promise.all(active.map((m) => fetch(`/api/spots/${m.spotId}/socio-number`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() as Promise<{ number: number | null }> : { number: null }).then((data) => [m.spotId, data.number] as const).catch(() => [m.spotId, null] as const)));
      if (!cancelled) setNumbers(Object.fromEntries(entries));
    })().catch(() => { if (!cancelled) setError(true); });
    void getUserProfileDoc(user.uid).then((data) => { if (!cancelled) setProfile({ name: data?.profileDisplayName ?? null, avatar: data?.avatarUrl ?? null, since: data?.joinedAt ?? user.metadata.creationTime ?? null }); }).catch(() => {});
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
    <section id="member-card" className="scroll-mt-28 space-y-3">
      <h2 className="text-sm font-bold text-ink/72">SPOT会員証</h2>
      <div className="mx-auto max-w-sm space-y-3">
        <SocioCard uid={user.uid} displayName={resolveDisplayName(profile.name, user.displayName, user.email)} avatarUrl={profile.avatar} memberSince={profile.since} memberships={memberships} memberNumbers={numbers} />
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
    <section className="border-t border-ink/10 pt-5"><Link href="/manage" className="font-semibold text-ink hover:text-moss">運営中のSPOT・クリエイター／団体登録 →</Link></section>
    <details className="border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold text-ink">活動・サポーター履歴</summary><div className="mt-4"><ActivityPassport user={user} /></div></details>
    <Link href="/settings" className="inline-block text-sm font-semibold text-ink/65 hover:text-ink">設定 →</Link>
  </div>;
}
