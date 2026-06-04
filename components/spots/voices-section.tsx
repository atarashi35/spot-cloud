"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import {
  getUserResponse,
  listOpenVotes,
  submitOpinion,
  submitResponse,
} from "@/lib/firestore/votes";
import { PlanAmount, SpotVote, VoteResponse } from "@/lib/types";

// ─── Poll card ────────────────────────────────────────────────────────

function PollCard({
  vote,
  spotId,
  uid,
  amount,
}: {
  vote: SpotVote;
  spotId: string;
  uid: string;
  amount: PlanAmount;
}) {
  const [existing, setExisting] = useState<VoteResponse | null | undefined>(undefined);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localCount, setLocalCount] = useState(vote.responseCount);

  useEffect(() => {
    void getUserResponse(spotId, vote.id, uid).then(setExisting);
  }, [spotId, vote.id, uid]);

  const voted = existing !== undefined && existing !== null;
  const loading = existing === undefined;

  async function handleVote() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await submitResponse(spotId, vote.id, uid, { optionId: selected, amount });
      setExisting({ uid, optionId: selected, amount, createdAt: new Date().toISOString() });
      setLocalCount((c) => c + 1);
    } catch {
      // already_responded など
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[20px] bg-mist p-5 space-y-4">
      <div>
        <div className="text-[10px] font-semibold tracking-[0.22em] text-ink/40">VOTE</div>
        <h4 className="mt-1 text-base font-bold text-ink">{vote.title}</h4>
        {vote.body ? <p className="mt-1 text-sm leading-6 text-ink/60">{vote.body}</p> : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-ink/30" />
        </div>
      ) : voted ? (
        <div className="space-y-2">
          {vote.options?.map((opt) => {
            const isChosen = existing?.optionId === opt.id;
            return (
              <div key={opt.id} className={`flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-medium ${isChosen ? "bg-ink text-white" : "bg-white/80 text-ink/60"}`}>
                {isChosen ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
                {opt.text}
              </div>
            );
          })}
          <p className="text-right text-[11px] text-ink/38">{localCount} 票</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vote.options?.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`flex w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-sm font-medium transition ${
                selected === opt.id
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-white text-ink/70 hover:border-ink/25"
              }`}
            >
              {opt.text}
            </button>
          ))}
          <button
            type="button"
            disabled={!selected || submitting}
            onClick={handleVote}
            className="cta-primary w-full disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "投票する"}
          </button>
        </div>
      )}

      {vote.deadline ? (
        <p className="text-[11px] text-ink/38">
          締切: {new Date(vote.deadline).toLocaleDateString("ja-JP")}
        </p>
      ) : null}
    </div>
  );
}

// ─── Open question card ───────────────────────────────────────────────

function OpenQuestionCard({
  vote,
  spotId,
  uid,
  amount,
}: {
  vote: SpotVote;
  spotId: string;
  uid: string;
  amount: PlanAmount;
}) {
  const [existing, setExisting] = useState<VoteResponse | null | undefined>(undefined);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getUserResponse(spotId, vote.id, uid).then(setExisting);
  }, [spotId, vote.id, uid]);

  const sent = existing !== undefined && existing !== null;
  const loading = existing === undefined;

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await submitResponse(spotId, vote.id, uid, { text: text.trim(), amount });
      setExisting({ uid, text: text.trim(), amount, createdAt: new Date().toISOString() });
    } catch {
      // already_responded
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[20px] bg-mist p-5 space-y-4">
      <div>
        <div className="text-[10px] font-semibold tracking-[0.22em] text-ink/40">OPINION</div>
        <h4 className="mt-1 text-base font-bold text-ink">{vote.title}</h4>
        {vote.body ? <p className="mt-1 text-sm leading-6 text-ink/60">{vote.body}</p> : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-ink/30" />
        </div>
      ) : sent ? (
        <div className="flex items-center gap-2 rounded-[14px] bg-white/80 px-4 py-3 text-sm text-ink/55">
          <CheckCircle2 className="h-4 w-4 text-moss shrink-0" />
          意見を送りました
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="あなたの意見を入力してください"
            rows={3}
            className="field resize-none"
          />
          <button
            type="button"
            disabled={!text.trim() || submitting}
            onClick={handleSubmit}
            className="cta-primary w-full disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "送信する"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Owner read-only preview ──────────────────────────────────────────

function OwnerVotePreview({ vote }: { vote: SpotVote }) {
  return (
    <div className="rounded-[20px] bg-mist p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-semibold tracking-[0.22em] text-ink/40">
          {vote.type === "poll" ? "VOTE" : "OPINION"}
        </div>
        <span className="text-[10px] text-ink/35">{vote.responseCount} 件の回答</span>
      </div>
      <h4 className="text-base font-bold text-ink">{vote.title}</h4>
      {vote.body ? <p className="text-sm leading-6 text-ink/60">{vote.body}</p> : null}
      {vote.type === "poll" && vote.options && (
        <div className="space-y-2">
          {vote.options.map((opt) => (
            <div key={opt.id} className="rounded-[14px] border border-ink/10 bg-white/80 px-4 py-2.5 text-sm text-ink/55">
              {opt.text}
            </div>
          ))}
        </div>
      )}
      {vote.type === "open_question" && (
        <div className="rounded-[14px] border border-ink/10 bg-white/80 px-4 py-2.5 text-sm text-ink/40 italic">
          テキスト自由記述
        </div>
      )}
      {vote.deadline ? (
        <p className="text-[11px] text-ink/38">締切: {new Date(vote.deadline).toLocaleDateString("ja-JP")}</p>
      ) : null}
      <p className="text-[11px] text-moss font-semibold">オーナー表示（投票不可）· 結果は管理画面で確認</p>
    </div>
  );
}

// ─── Opinion box ──────────────────────────────────────────────────────

function OpinionBox({
  spotId,
  uid,
  amount,
}: {
  spotId: string;
  uid: string;
  amount: PlanAmount;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await submitOpinion(spotId, uid, text.trim(), amount);
      setSent(true);
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-[20px] border border-dashed border-ink/15 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-ink/40" />
        <span className="text-sm font-semibold text-ink/55">ご意見ボックス</span>
      </div>
      {sent ? (
        <div className="flex items-center gap-2 text-sm text-ink/55">
          <CheckCircle2 className="h-4 w-4 text-moss shrink-0" />
          送信しました。またいつでもどうぞ。
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="SPOTへの要望・感想などをどうぞ"
            rows={3}
            className="field resize-none"
          />
          <button
            type="button"
            disabled={!text.trim() || submitting}
            onClick={handleSubmit}
            className="cta-primary w-full disabled:opacity-40"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "送る"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── VoicesSection (export) ───────────────────────────────────────────

export function VoicesSection({
  spotId,
  uid,
  amount,
  opinionBoxEnabled,
  canParticipate,
  canAcceptMembership,
  isOwner,
  onSignupClick,
}: {
  spotId: string;
  uid?: string;
  amount?: PlanAmount;
  opinionBoxEnabled?: boolean;
  canParticipate: boolean;
  canAcceptMembership: boolean;
  isOwner?: boolean;
  onSignupClick: () => void;
}) {
  const [votes, setVotes] = useState<SpotVote[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void listOpenVotes(spotId).then((v) => { setVotes(v); setLoaded(true); });
  }, [spotId]);

  const hasContent = votes.length > 0 || opinionBoxEnabled;
  if (loaded && !hasContent) return null;

  return (
    <section className="panel px-6 py-8 sm:px-8">
      <h3 className="text-xl font-bold text-ink">みんなの声</h3>
      <p className="mt-1 text-sm text-ink/50">ソシオだけが参加できる投票・意見コーナーです。</p>

      <div className="relative mt-6 space-y-4">
        {/* コンテンツ */}
        <div className={`space-y-4 ${!canParticipate && !isOwner ? "pointer-events-none select-none blur-[2px]" : ""}`}>
          {votes.map((vote) => {
            // オーナーはread-only表示
            if (isOwner) return <OwnerVotePreview key={vote.id} vote={vote} />;
            if (!uid || !amount) return null;
            return vote.type === "poll" ? (
              <PollCard key={vote.id} vote={vote} spotId={spotId} uid={uid} amount={amount} />
            ) : (
              <OpenQuestionCard key={vote.id} vote={vote} spotId={spotId} uid={uid} amount={amount} />
            );
          })}
          {/* 意見ボックス: ソシオのみ（オーナーは管理画面で見る） */}
          {opinionBoxEnabled && uid && amount && !isOwner ? (
            <OpinionBox spotId={spotId} uid={uid} amount={amount} />
          ) : null}
          {opinionBoxEnabled && isOwner ? (
            <div className="rounded-[20px] border border-dashed border-ink/15 p-5 text-sm text-ink/45 text-center">
              ご意見ボックスは有効です。受信内容は管理画面で確認できます。
            </div>
          ) : null}

          {/* ローディング */}
          {!loaded && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-ink/30" />
            </div>
          )}
        </div>

        {/* 非ソシオ向けオーバーレイ */}
        {!canParticipate && !isOwner && loaded && hasContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] bg-white/70 backdrop-blur-[3px]">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-ink/40">MEMBERS ONLY</p>
            {canAcceptMembership && (
              <button
                type="button"
                onClick={onSignupClick}
                className="rounded-full border border-ink/20 bg-white px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-ink/40"
              >
                ソシオになる
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
