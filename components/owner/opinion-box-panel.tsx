"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { listOpinions, markOpinionRead, setOpinionBoxEnabled } from "@/lib/firestore/votes";
import { OpinionBoxEntry, Spot } from "@/lib/types";

type Props = {
  spot: Spot;
  onSpotChange: (updated: Partial<Spot>) => void;
};

export function OpinionBoxPanel({ spot, onSpotChange }: Props) {
  const [opinions, setOpinions] = useState<OpinionBoxEntry[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    void listOpinions(spot.id).then(setOpinions);
  }, [spot.id]);

  const unread = opinions?.filter((o) => !o.isRead) ?? [];
  const unreadCount = unread.length;

  async function handleToggle() {
    const next = !spot.opinionBoxEnabled;
    await setOpinionBoxEnabled(spot.id, next);
    onSpotChange({ opinionBoxEnabled: next });
  }

  async function handleMarkRead(opinionId: string) {
    await markOpinionRead(spot.id, opinionId);
    setOpinions((prev) =>
      prev?.map((o) => (o.id === opinionId ? { ...o, isRead: true } : o)) ?? prev
    );
  }

  // 表示する意見：展開時は全件、閉じているときは未読3件まで
  const displayed = expanded
    ? (opinions ?? [])
    : unread.slice(0, 3);

  return (
    <div className="mt-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-ink/60" />
          <span className="text-sm font-bold text-ink/72">ご意見ボックス</span>
          {unreadCount > 0 && (
            <span className="flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-moss px-1 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleToggle()}
          role="switch"
          aria-checked={spot.opinionBoxEnabled}
          aria-label="ご意見ボックスのオン・オフ"
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-ink/5"
        >
          <span
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              spot.opinionBoxEnabled ? "bg-moss" : "bg-ink/20"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                spot.opinionBoxEnabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </span>
          <span className={`text-sm font-bold ${spot.opinionBoxEnabled ? "text-moss" : "text-ink/55"}`}>
            {spot.opinionBoxEnabled ? "オン" : "オフ"}
          </span>
        </button>
      </div>

      {/* 意見リスト */}
      {opinions === null ? (
        <div className="mt-2 space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-[12px] bg-mist" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <p className="mt-2 text-xs text-ink/60">
          {spot.opinionBoxEnabled
            ? (unreadCount === 0 && (opinions.length > 0)
                ? "未読の意見はありません"
                : "まだ意見は届いていません")
            : "オンにすると応援会員から意見を受け取れます"}
        </p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {displayed.map((o) => (
            <div
              key={o.id}
              className={`rounded-[12px] px-3 py-2.5 ${
                o.isRead ? "bg-mist" : "bg-ink/5 ring-1 ring-ink/10"
              }`}
            >
              <p className="text-xs leading-5 text-ink/75">{o.text}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-ink/58">
                  {new Date(o.createdAt).toLocaleDateString("ja-JP")}
                </span>
                {!o.isRead && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(o.id)}
                    className="text-xs font-semibold text-ink/60 hover:text-ink/78 transition-colors"
                  >
                    既読
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* もっと見る / 閉じる */}
      {opinions !== null && opinions.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="mt-2 text-[13px] font-semibold text-ink/60 hover:text-ink/72 transition-colors"
        >
          {expanded ? "閉じる ↑" : `全${opinions.length}件を見る ↓`}
        </button>
      )}
    </div>
  );
}
