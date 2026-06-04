"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare, ToggleLeft, ToggleRight } from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { VoteForm } from "@/components/owner/vote-form";
import { useAuth } from "@/components/providers/auth-provider";
import {
  closeVote,
  listOpinions,
  listResponses,
  listVotes,
  markOpinionRead,
  setOpinionBoxEnabled,
} from "@/lib/firestore/votes";
import { getSpotFromFirestore } from "@/lib/firestore/spots";
import { OpinionBoxEntry, Spot, SpotVote, VoteResponse } from "@/lib/types";

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
              <span className="text-ink/55">{count} 票 ({pct}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="flex justify-between border-t border-ink/8 pt-3 text-xs text-ink/45">
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
        <div key={i} className="rounded-[16px] bg-mist px-4 py-3 text-sm text-ink/70">{r.text}</div>
      ))}
      <div className="border-t border-ink/8 pt-3 text-xs text-ink/45 text-right">
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
  const [opinions, setOpinions] = useState<OpinionBoxEntry[]>([]);
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
    setOpinions(await listOpinions(spotId));
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

  async function handleToggleOpinionBox() {
    if (!spot) return;
    const next = !spot.opinionBoxEnabled;
    await setOpinionBoxEnabled(spotId, next);
    setSpot((s) => s ? { ...s, opinionBoxEnabled: next } : s);
  }

  async function handleMarkRead(opinionId: string) {
    await markOpinionRead(spotId, opinionId);
    setOpinions((prev) => prev.map((o) => o.id === opinionId ? { ...o, isRead: true } : o));
  }

  const unreadCount = opinions.filter((o) => !o.isRead).length;

  return (
    <PageShell className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/manage" className="icon-button">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold text-ink">みんなの声</h1>
        </div>
        {user && (
          <button type="button" onClick={() => setFormOpen(true)} className="cta-primary">
            作成する
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink/30" />
        </div>
      ) : (
        <>
          {/* アンケート・意見募集一覧 */}
          <div className="panel divide-y divide-ink/8 overflow-hidden">
            {votes.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-ink/45">
                まだ投稿がありません。「作成する」から始めてください。
              </div>
            ) : votes.map((vote) => {
              const isExpanded = expanded === vote.id;
              const responses = responseMap[vote.id] ?? [];
              return (
                <div key={vote.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${vote.status === "open" ? "bg-green-100 text-green-700" : "bg-ink/8 text-ink/45"}`}>
                          {vote.status === "open" ? "受付中" : "終了"}
                        </span>
                        <span className="text-[10px] text-ink/40">{vote.type === "poll" ? "アンケート" : "意見募集"}</span>
                      </div>
                      <p className="mt-1.5 font-semibold text-ink">{vote.title}</p>
                      <p className="mt-0.5 text-xs text-ink/45">{vote.responseCount} 件の回答</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {vote.status === "open" && (
                        <button type="button" onClick={() => handleClose(vote.id)} className="text-xs font-semibold text-ink/40 hover:text-ink/70">
                          締め切る
                        </button>
                      )}
                      <button type="button" onClick={() => handleExpand(vote.id)} className="text-xs font-semibold text-moss">
                        {isExpanded ? "閉じる" : "結果を見る"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 rounded-[16px] bg-mist p-4">
                      {responses.length === 0 ? (
                        <p className="text-sm text-ink/45">まだ回答がありません</p>
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

          {/* ご意見ボックス */}
          <div className="panel px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-ink/50" />
                <span className="font-semibold text-ink">ご意見ボックス</span>
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-moss text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button type="button" onClick={handleToggleOpinionBox} className="flex items-center gap-1.5 text-sm font-semibold text-ink/55 hover:text-ink">
                {spot?.opinionBoxEnabled ? (
                  <><ToggleRight className="h-5 w-5 text-moss" />オン</>
                ) : (
                  <><ToggleLeft className="h-5 w-5" />オフ</>
                )}
              </button>
            </div>

            {opinions.length > 0 ? (
              <div className="mt-4 space-y-3">
                {opinions.map((o) => (
                  <div key={o.id} className={`rounded-[16px] px-4 py-3 ${o.isRead ? "bg-mist" : "bg-ink/5 ring-1 ring-ink/10"}`}>
                    <p className="text-sm text-ink/75">{o.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-ink/35">¥{o.amount}/月 · {new Date(o.createdAt).toLocaleDateString("ja-JP")}</span>
                      {!o.isRead && (
                        <button type="button" onClick={() => handleMarkRead(o.id)} className="text-[11px] font-semibold text-ink/45 hover:text-ink/70">
                          既読にする
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/40">
                {spot?.opinionBoxEnabled ? "まだ意見は届いていません" : "オンにするとソシオから意見を受け取れます"}
              </p>
            )}
          </div>
        </>
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
