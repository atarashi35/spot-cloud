"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { PublicProfile, PublicProfileKind } from "@/lib/types";

const statusLabel = { draft: "未申請", pending: "審査中", approved: "公開中", rejected: "要修正" } as const;

export function PublicProfileSection({ avatarUrl }: { avatarUrl?: string | null }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [kind, setKind] = useState<PublicProfileKind>("creator");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [fields, setFields] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void user.getIdToken().then(async (token) => {
      const response = await fetch("/api/public-profile", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json() as { profile: PublicProfile | null };
      if (!data.profile) return;
      const p = data.profile;
      setProfile(p); setKind(p.kind); setName(p.name); setBio(p.bio); setFields(p.fields.join("、"));
      setPrefecture(p.prefecture ?? ""); setCity(p.city ?? "");
      setWebsiteUrl(p.websiteUrl ?? ""); setInstagramUrl(p.instagramUrl ?? "");
    });
  }, [user]);

  async function submit() {
    if (!user || !name.trim() || !bio.trim()) {
      setMessage("名前と紹介文を入力してください。");
      return;
    }
    try {
      setSaving(true); setMessage(null);
      const token = await user.getIdToken();
      const response = await fetch("/api/public-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind, name, bio, fields: fields.split(/[、,\n]/).map((v) => v.trim()).filter(Boolean), prefecture, city, avatarUrl, websiteUrl, instagramUrl }),
      });
      const data = await response.json() as { profile?: PublicProfile; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error ?? "submit_failed");
      setProfile(data.profile); setMessage("審査を申請しました。");
    } catch {
      setMessage("申請できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel px-6 py-8 sm:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="chip">PUBLIC PROFILE</span>
          <h2 className="mt-4 text-2xl font-extrabold text-ink">公開プロフィール</h2>
          <p className="mt-2 text-sm text-ink/68">クリエイターまたは団体として「つながり」に掲載するための申請です。</p>
        </div>
        {profile ? <StatusBadge tone={profile.status === "approved" ? "success" : profile.status === "rejected" ? "danger" : "warning"}>{statusLabel[profile.status]}</StatusBadge> : null}
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["creator", "organization"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setKind(value)} className={`rounded-[14px] border px-4 py-3 text-sm font-semibold ${kind === value ? "border-ink bg-ink text-white" : "border-ink/12 bg-white text-ink"}`}>
              {value === "creator" ? "クリエイター" : "団体"}
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold text-ink">公開名
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" />
        </label>
        <label className="block text-sm font-semibold text-ink">紹介文
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={5} className="mt-2 w-full resize-y rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" />
        </label>
        <label className="block text-sm font-semibold text-ink">活動分野
          <input value={fields} onChange={(e) => setFields(e.target.value)} placeholder="例：音楽、写真、まちづくり" className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-ink">都道府県<input value={prefecture} onChange={(e) => setPrefecture(e.target.value)} className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" /></label>
          <label className="block text-sm font-semibold text-ink">市区町村<input value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" /></label>
          <label className="block text-sm font-semibold text-ink">Webサイト<input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" /></label>
          <label className="block text-sm font-semibold text-ink">Instagram<input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="mt-2 w-full rounded-[12px] border border-ink/15 bg-white px-3 py-2.5 font-normal outline-none focus:border-moss" /></label>
        </div>
        {profile?.reviewNote ? <p className="rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-800">運営から：{profile.reviewNote}</p> : null}
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => void submit()} disabled={saving} className="cta-primary text-sm">{saving ? "申請中..." : profile ? "内容を更新して再申請" : "審査を申請"}</button>
          {message ? <span className="text-sm text-ink/65">{message}</span> : null}
        </div>
      </div>
    </section>
  );
}
