"use client";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { getFirestoreDb } from "@/lib/firebase/client";

const categories = [
  { key: "posts", label: "投稿" },
  { key: "events", label: "イベント" },
  { key: "polls", label: "投票" },
  { key: "opportunities", label: "募集" },
  { key: "applications", label: "募集への申し出" },
] as const;
type Category = (typeof categories)[number]["key"];
type Channel = "inApp" | "email";
type Preferences = Partial<Record<Category, Partial<Record<Channel, boolean>>>>;

export function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    return onSnapshot(doc(getFirestoreDb(), "users", user.uid), (snapshot) => { setPreferences(snapshot.data()?.notificationPreferences ?? {}); setLoading(false); }, () => { setError("通知設定を読み込めませんでした。"); setLoading(false); });
  }, [user]);
  async function update(category: Category, channel: Channel, enabled: boolean) {
    if (!user || saving) return;
    const key = `${category}-${channel}`; setSaving(key); setError("");
    try { await setDoc(doc(getFirestoreDb(), "users", user.uid), { notificationPreferences: { [category]: { [channel]: enabled } } }, { merge: true }); }
    catch { setError("通知設定を保存できませんでした。"); }
    finally { setSaving(null); }
  }
  return <section className="panel px-6 py-8 sm:px-8"><h2 className="text-xl font-bold text-ink">通知</h2>{!user ? <p className="mt-4 text-sm text-ink/65">ログインすると設定できます。</p> : loading ? <p className="mt-4 text-sm text-ink/65">読み込み中...</p> : <><div className="mt-4 grid grid-cols-[1fr_4rem_4rem] items-center gap-2 border-b border-ink/10 pb-2 text-center text-xs text-ink/60"><span className="text-left">種類</span><span>アプリ内</span><span>メール</span></div>{categories.map(({ key, label }) => <div key={key} className="grid min-h-14 grid-cols-[1fr_4rem_4rem] items-center gap-2 border-b border-ink/5 text-sm"><span>{label}</span>{(["inApp", "email"] as const).map((channel) => <label key={channel} className="flex h-11 items-center justify-center"><span className="sr-only">{label}の{channel === "email" ? "メール" : "アプリ内"}通知</span><input type="checkbox" className="h-5 w-5 accent-black" checked={preferences[key]?.[channel] !== false} disabled={saving !== null} onChange={(event) => void update(key, channel, event.target.checked)} /></label>)}</div>)}<p className="mt-3 text-xs text-ink/60">決済やアカウントに関する重要なお知らせは、この設定にかかわらず届きます。</p></>}{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}</section>;
}
