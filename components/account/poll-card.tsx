"use client";

import { OptimizedImage } from "@/components/ui/optimized-image";

import { useState } from "react";
import type { User } from "firebase/auth";

export type FeedPoll = { id: string; spotId: string; spotName: string; spotImage?: string; title: string; body: string; options: { id: string; text: string }[]; deadline: string | null; multiple: boolean; createdAt: string; counts: Record<string, number>; responseCount: number; selected: string[]; canVote: boolean };

export function PollCard({ poll, user }: { poll: FeedPoll; user: User }) {
  const [selected, setSelected] = useState<string[]>(poll.selected);
  const [voted, setVoted] = useState(poll.selected.length > 0);
  const [counts, setCounts] = useState(poll.counts ?? {});
  const [count, setCount] = useState(poll.responseCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const closed = Boolean(poll.deadline && Date.parse(poll.deadline) <= Date.now());
  async function submit() {
    if (!selected.length || busy) return;
    setBusy(true); setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/spots/${encodeURIComponent(poll.spotId)}/polls`, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ pollId: poll.id, optionIds: selected }) });
      if (!response.ok) throw new Error();
      setCounts((old) => { const next = { ...old }; selected.forEach((id) => { next[id] = (next[id] ?? 0) + 1; }); return next; }); setCount((n) => n + 1); setVoted(true);
    } catch { setError("投票できませんでした。再読み込みしてお試しください。"); } finally { setBusy(false); }
  }
  return <article className="rounded-2xl bg-white p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-mist">{poll.spotImage ? <OptimizedImage src={poll.spotImage} sizes="40px" width={80} height={80} className="h-full w-full object-cover" /> : poll.spotName.slice(0, 1)}</span><div><p className="text-sm font-bold">{poll.spotName}</p><p className="text-xs text-ink/55">投票</p></div></div><h3 className="mt-4 font-bold">{poll.title}</h3>{poll.body ? <p className="mt-1 whitespace-pre-line text-sm text-ink/65">{poll.body}</p> : null}<div className="mt-4 space-y-2">{poll.options.map((option) => { const picked = selected.includes(option.id); const percent = count ? Math.round((counts[option.id] ?? 0) / count * 100) : 0; return <button key={option.id} type="button" disabled={voted || closed || !poll.canVote || busy} aria-pressed={picked} onClick={() => setSelected((old) => poll.multiple ? (old.includes(option.id) ? old.filter((id) => id !== option.id) : [...old, option.id]) : [option.id])} className={`relative flex min-h-11 w-full items-center justify-between overflow-hidden rounded-xl border px-3 py-2 text-left text-sm ${picked ? "border-moss" : "border-ink/10"}`}><span className="absolute inset-y-0 left-0 bg-moss/10" style={{ width: voted || closed || !poll.canVote ? `${percent}%` : "0%" }} /><span className="relative">{option.text}</span>{voted || closed || !poll.canVote ? <span className="relative shrink-0">{percent}%</span> : null}</button>; })}</div>{!voted && !closed && poll.canVote ? <button type="button" disabled={!selected.length || busy} onClick={() => void submit()} className="cta-primary mt-3 w-full disabled:opacity-40">{busy ? "送信中..." : "投票する"}</button> : null}<p className="mt-3 text-xs text-ink/55">{count}票{closed ? " · 終了" : poll.deadline ? ` · ${new Date(poll.deadline).toLocaleString("ja-JP")}まで` : ""}</p>{error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}</article>;
}
