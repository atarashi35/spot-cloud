"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { VoteForm } from "@/components/owner/vote-form";
import { useAuth } from "@/components/providers/auth-provider";
import {
  closeVote,
  deleteVote,
  listResponses,
  listVotes,
} from "@/lib/firestore/votes";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { Spot, SpotVote, VoteResponse } from "@/lib/types";

function PollResults({ responses, vote }: { responses: VoteResponse[]; vote: SpotVote }) {
  const totalAmount = responses.reduce((s, r) => s + r.amount, 0);
  const counts = Object.fromEntries((vote.options ?? []).map((o) => [o.id, 0]));
  responses.forEach((r) => { if (r.optionId) counts[r.optionId] = (counts[r.optionId] ?? 0) + 1; });

  return (
    <div className="space-y-2">
      {(vote.options ?? []).map((opt) => {
        const count = counts[opt.id] ?? 0;
        const pct = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
        return (
          <div key={opt.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{opt.text}</span>
              <span className="text-ink/68">{count} 票 ({pct}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="flex justify-between border-t border-ink/8 pt-3 text-xs text-ink/65">
        <span>{responses.length} 票</span>
        <span>合計月額 ¥{totalAmount.toLocaleString()}</span>
      </div>
    </div>
  );
}

function OpenQuestionResults({ responses }: { responses: VoteResponse[] }) {
  const totalAmount = responses.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="space-y-3">
      {responses.map((r, i) => (
        <div key={i} className="rounded-[16px] bg-mist px-4 py-3 text-sm text-ink/78">{r.text}</div>
      ))}
      <div className="border-t border-ink/8 pt-3 text-xs text-ink/65 text-right">
        {responses.length} 件 ／ 合計月額 ¥{totalAmount.toLocaleString()}
      </div>
    </div>
  );
}

export default function VoicesManagePage({ params }: { params: Promise<{ spotId: string }> }) {
  const { spotId } = use(params);
  const { user } = useAuth();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [votes, setVotes] = useState<SpotVote[]>([]);
  const [responseMap, setResponseMap] = useState<Record<string, VoteResponse[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [nextSpot, nextVotes] = await Promise.all([
      getSpotFromFirestore(spotId),
      listVotes(spotId),
    ]);
    setSpot(nextSpot);
    setVotes(nextVotes);
    setLoading(false);
  }

  useEffect(() => { void load(); }, [spotId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExpand(voteId: string) {
    if (expanded === voteId) { setExpanded(null); return; }
    setExpanded(voteId);
    if (!responseMap[voteId]) {
      const res = await listResponses(spotId, voteId);
      setResponseMap((m) => ({ ...m, [voteId]: res }));
    }
  }

  async function handleClose(voteId: string) {
    await closeVote(spotId, voteId);
    setVotes((prev) => prev.map((v) => v.id === voteId ? { ...v, status: "closed" } : v));
  }

  async function handleDelete(voteId: string) {
    if (!confirm("このアンケートを削除しますか？回答データもすべて削除されます。")) return;
    await deleteVote(spotId, voteId);
    setVotes((prev) => prev.filter((v) => v.id !== voteId));
  }

  return (
    <PageShell className="space-y-6 py-8">
      <Breadcrumb items={[
        { label: "管理", href: "/manage" },
        { label: spot?.name ?? "…", href: "/manage" },
        { label: "アンケート" },
      ]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">アンケート</h1>
        {user && (
          <button type="button" onClick={() => setFormOpen(true)} className="cta-primary">
            作成する
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink/55" />
        </div>
      ) : (
        <div className="panel divide-y divide-ink/8 overflow-hidden">
          {votes.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-ink/65">
              まだアンケートがありません。「作成する」から始めてください。
            </div>
          ) : votes.map((vote) => {
            const isExpanded = expanded === vote.id;
            const responses = responseMap[vote.id] ?? [];
            return (
              <div key={vote.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tracking-wider ${vote.status === "open" ? "bg-green-100 text-green-700" : "bg-ink/8 text-ink/65"}`}>
                        {vote.status === "open" ? "受付中" : "終了"}
                      </span>
                      <span className="text-xs text-ink/60">{vote.type === "poll" ? "アンケート" : "意見募集"}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-ink">{vote.title}</p>
                    <p className="mt-0.5 text-xs text-ink/65">{vote.responseCount} 件の回答</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {vote.status === "open" && (
                      <button type="button" onClick={() => void handleClose(vote.id)} className="text-xs font-semibold text-ink/60 hover:text-ink/78">
                        締め切る
                      </button>
                    )}
                    <button type="button" onClick={() => void handleExpand(vote.id)} className="text-xs font-semibold text-moss">
                      {isExpanded ? "閉じる" : "結果を見る"}
                    </button>
                    <button type="button" onClick={() => void handleDelete(vote.id)} className="rounded-full p-1.5 text-ink/55 transition hover:bg-red-50 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 rounded-[16px] bg-mist p-4">
                    {responses.length === 0 ? (
                      <p className="text-sm text-ink/65">まだ回答がありません</p>
                    ) : vote.type === "poll" ? (
                      <PollResults responses={responses} vote={vote} />
                    ) : (
                      <OpenQuestionResults responses={responses} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {user && (
        <VoteForm
          spotId={spotId}
          createdBy={user.uid}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onCreated={load}
        />
      )}
    </PageShell>
  );
}
