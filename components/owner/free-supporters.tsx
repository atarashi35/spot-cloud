"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type Supporter = { name: string; joinedAt: string };

export function FreeSupporters({ spotId }: { spotId: string }) {
  const { user } = useAuth();
  const [supporters, setSupporters] = useState<Supporter[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSupporters(null); setError(false);
    void user.getIdToken().then((token) => fetch(`/api/spots/${spotId}/free-supporters`, { headers: { Authorization: `Bearer ${token}` } }))
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<{ supporters: Supporter[] }>; })
      .then((data) => { if (!cancelled) setSupporters(data.supporters); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [user, spotId]);
  return <section className="mt-6 border-t border-ink/10 pt-5">
    <h2 className="font-bold text-ink">無料サポーター{supporters ? `（${supporters.length}人）` : ""}</h2>
    {error ? <p className="mt-3 text-sm text-red-700">読み込めませんでした。</p> : !supporters ? <p className="mt-3 text-sm text-ink/60">読み込み中です。</p> : supporters.length === 0 ? <p className="mt-3 text-sm text-ink/60">まだ無料サポーターはいません。</p> : <ul className="mt-2 divide-y divide-ink/8">{supporters.map((supporter, index) => <li key={`${supporter.joinedAt}-${index}`} className="flex justify-between gap-4 py-3 text-sm"><span>{supporter.name || "名前未設定"}</span><span className="text-xs text-ink/60">{supporter.joinedAt ? supporter.joinedAt.slice(0, 10).replace(/-/g, "/") : ""}</span></li>)}</ul>}
  </section>;
}
