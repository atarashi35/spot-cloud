"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ToggleLeft, ToggleRight } from "lucide-react";
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
          <MessageSquare className="h-3.5 w-3.5 text-ink/40" />
          <span className="text-xs font-semibold tracking-[0.15em] text-ink/45">ご意見ボックス</span>
          {unreadCount > 0 && (
            <span className="flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-moss px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleToggle()}
          className="flex items-center gap-1 text-[11px] font-semibold text-ink/45 hover:text-ink transition-colors"
        >
          {spot.opinionBoxEnabled ? (
            <><ToggleRight className="h-4 w-4 text-moss" />オン</>
          ) : (
            <><ToggleLeft className="h-4 w-4" />オフ</>
          )}
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
        <p className="mt-2 text-xs text-ink/38">
          {spot.opinionBoxEnabled
            ? (unreadCount === 0 && (opinions.length > 0)
                ? "未読の意見はありません"
                : "まだ意見は届いていません")
            : "オンにするとサポーターから意見を受け取れます"}
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
                <span className="text-[10px] text-ink/35">
                  {new Date(o.createdAt).toLocaleDateString("ja-JP")}
                </span>
                {!o.isRead && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(o.id)}
                    className="text-[10px] font-semibold text-ink/40 hover:text-ink/70 transition-colors"
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
          className="mt-2 text-[11px] font-semibold text-ink/38 hover:text-ink/60 transition-colors"
        >
          {expanded ? "閉じる ↑" : `全${opinions.length}件を見る ↓`}
        </button>
      )}
    </div>
  );
}
