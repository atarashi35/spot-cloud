"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { LoginModal } from "@/components/auth/login-modal";

type Event = { spotId: string; spotName: string; eventId: string; title: string; startAt: string; checkedIn: boolean; displayName: string };
type Supporter = { spotId: string; spotName: string; kind: "free" | "monthly"; amount?: number; displayName: string };

export function MemberCheckin() {
  const { authReady, user } = useAuth();
  const [token, setToken] = useState("");
  const [events, setEvents] = useState<Event[] | null>(null);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [error, setError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    const scanned = window.location.hash.slice(1);
    if (/^[A-Za-z0-9_-]{43}$/.test(scanned)) {
      sessionStorage.setItem("spot_member_checkin_token", scanned);
      setToken(scanned);
    } else {
      setToken(sessionStorage.getItem("spot_member_checkin_token") ?? "");
    }
  }, []);
  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;
    void user.getIdToken().then((auth) => fetch("/api/member-checkin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` }, body: JSON.stringify({ token }) }))
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<{ events: Event[]; supporters: Supporter[] }>; })
      .then((data) => { if (!cancelled) { setEvents(data.events); setSupporters(data.supporters); } })
      .catch(() => { if (!cancelled) setError("QRの有効期限が切れたか、読み取れませんでした。会員にQRの更新を依頼してください。"); });
    return () => { cancelled = true; };
  }, [user, token]);
  async function checkin(event: Event) {
    if (!user) return;
    setBusy(event.eventId); setError("");
    try {
      const auth = await user.getIdToken();
      const response = await fetch("/api/member-checkin", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` }, body: JSON.stringify({ token, spotId: event.spotId, eventId: event.eventId }) });
      if (!response.ok) throw new Error();
      setEvents((current) => current?.map((item) => item.spotId === event.spotId && item.eventId === event.eventId ? { ...item, checkedIn: true } : item) ?? null);
    } catch { setError("受付できませんでした。QRの期限と参加状況を確認してください。"); }
    finally { setBusy(""); }
  }
  return <main className="panel mx-auto max-w-xl px-6 py-8">
    <h1 className="text-2xl font-bold">サポーター確認</h1>
    {!authReady ? <p className="mt-4 text-sm">確認中です。</p> : !user ? <><p className="mt-4 text-sm">受付するSPOTの運営者アカウントでログインしてください。</p><button className="cta-primary mt-4" onClick={() => setLoginOpen(true)}>ログイン</button><LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} returnTo="/member-checkin" /></> : null}
    {authReady && user && !token ? <p className="mt-4 text-sm">会員の受付用QRを読み取ってください。</p> : null}
    {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
    {supporters.map((supporter) => <div key={supporter.spotId} className="mt-4 border-t border-ink/10 pt-4">
      <p className="font-bold">{supporter.spotName}</p>
      <p className="mt-1 text-sm">{supporter.displayName || "名前未設定"}</p>
      <p className="mt-2 text-sm font-semibold text-moss">{supporter.kind === "free" ? "無料サポーター" : `月額サポーター${supporter.amount ? `（${supporter.amount.toLocaleString("ja-JP")}円／月）` : ""}`}</p>
    </div>)}
    {user && events && supporters.length === 0 ? <p className="mt-4 text-sm">運営中のSPOTに、この会員のサポーター登録はありません。</p> : null}
    {events && events.length > 0 ? <h2 className="mt-7 text-sm font-semibold text-ink/65">イベント受付</h2> : null}
    {events?.map((event) => <div key={`${event.spotId}-${event.eventId}`} className="mt-4 border-t border-ink/10 pt-4">
      <p className="text-sm text-ink/60">{event.spotName} · {event.startAt ? new Date(event.startAt).toLocaleString("ja-JP") : "日時未設定"}</p>
      <p className="mt-1 font-bold">{event.title}</p><p className="mt-1 text-sm">{event.displayName || "参加者"}</p>
      <button type="button" className="cta-primary mt-3 text-sm" disabled={event.checkedIn || Boolean(busy)} onClick={() => void checkin(event)}>{event.checkedIn ? "受付済み" : busy === event.eventId ? "処理中..." : "チェックイン"}</button>
    </div>)}
  </main>;
}
