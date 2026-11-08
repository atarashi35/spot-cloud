"use client";

import { Minus, Plus } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { KO_UNIT_AMOUNT, MIN_KO, PlanAmount } from "@/lib/types";

export function SupportChoiceModal({ open, onClose, spotName, amount, onAmountChange, canAcceptMonthly, isFollowing, onMonthly, onFree }: {
  open: boolean;
  onClose: () => void;
  spotName: string;
  amount: PlanAmount;
  onAmountChange: (amount: PlanAmount) => void;
  canAcceptMonthly: boolean;
  isFollowing: boolean;
  onMonthly: () => void;
  onFree: () => void;
}) {
  return (
    <ModalShell open={open} onClose={onClose} title="サポーターになる" size="sm">
      <p className="text-sm font-medium text-ink/65">{spotName}</p>
      {canAcceptMonthly ? (
        <div className="mt-6">
          <h3 className="text-base font-bold text-ink">月額でサポート</h3>
          <div className="mt-4 flex items-center justify-center gap-5">
            <button type="button" aria-label="月額を100円減らす" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink disabled:opacity-30" disabled={amount <= MIN_KO * KO_UNIT_AMOUNT} onClick={() => onAmountChange(Math.max(MIN_KO * KO_UNIT_AMOUNT, amount - KO_UNIT_AMOUNT))}>
              <Minus className="h-5 w-5" />
            </button>
            <div className="min-w-32 text-center tabular-nums" aria-live="polite">
              <span className="text-3xl font-bold text-ink">{amount.toLocaleString("ja-JP")}</span><span className="ml-1 text-sm text-ink/65">円／月</span>
            </div>
            <button type="button" aria-label="月額を100円増やす" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink" onClick={() => onAmountChange(amount + KO_UNIT_AMOUNT)}>
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-ink/55">1口100円・毎月のお支払い</p>
          <button type="button" className="cta-primary mt-5 w-full" onClick={onMonthly}>月額{amount.toLocaleString("ja-JP")}円でサポート</button>
        </div>
      ) : (
        <p className="mt-5 text-sm text-ink/65">月額サポートは準備中です。</p>
      )}
      {!isFollowing ? (
        <button type="button" className="cta-secondary mt-3 w-full" onClick={onFree}>無料サポーターになる</button>
      ) : null}
    </ModalShell>
  );
}
