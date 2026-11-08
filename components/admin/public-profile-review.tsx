"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { PublicProfile } from "@/lib/types";

export function PublicProfileReview() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PublicProfile[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void user.getIdToken().then(async (token) => {
      const response = await fetch("/api/admin/public-profiles", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const data = await response.json() as { profiles: PublicProfile[] };
      setProfiles(data.profiles);
    });
  }, [user]);

  async function review(uid: string, status: "approved" | "rejected") {
    if (!user) return;
    const note = status === "rejected" ? window.prompt("修正してほしい内容を入力してください。") ?? "" : "";
    if (status === "rejected" && !note) return;
    setPending(uid);
    const token = await user.getIdToken();
    const response = await fetch(`/api/admin/public-profiles/${uid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, note }),
    });
    if (response.ok) setProfiles((current) => current?.map((p) => p.uid === uid ? { ...p, status, reviewNote: note } : p) ?? null);
    setPending(null);
  }

  return (
    <section className="mt-10 space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold text-ink">公開プロフィール審査</h2>
        <p className="mt-1 text-sm text-ink/68">クリエイター・団体の公開申請を確認します。</p>
      </div>
      {!profiles ? <p className="text-sm text-ink/60">読み込み中です。</p> : profiles.length === 0 ? <p className="text-sm text-ink/60">申請はありません。</p> : (
        <div className="divide-y divide-ink/8 overflow-hidden rounded-[20px] border border-ink/8 bg-white">
          {profiles.map((profile) => (
            <div key={profile.uid} className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink">{profile.name}</h3>
                  <StatusBadge tone={profile.status === "approved" ? "success" : profile.status === "rejected" ? "danger" : "warning"}>{profile.kind === "creator" ? "クリエイター" : "団体"}・{profile.status}</StatusBadge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/70">{profile.bio}</p>
                {profile.fields.length ? <p className="mt-1 text-xs text-ink/55">{profile.fields.join(" / ")}</p> : null}
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={pending === profile.uid} onClick={() => void review(profile.uid, "approved")} className="rounded-full bg-moss px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">承認</button>
                <button type="button" disabled={pending === profile.uid} onClick={() => void review(profile.uid, "rejected")} className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-40">差し戻し</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
