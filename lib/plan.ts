import { KO_UNIT_AMOUNT } from "@/lib/types";

/**
 * 口数制（1口 = ¥100）の口数 ⇔ 金額 変換ユーティリティ。
 * planAmount は「口数 × 100」の月額（円）。既存の固定プラン金額（300/500/1000）も
 * そのまま 3口/5口/10口 として扱える。表示・メール・API全箇所でこれらを再利用する。
 */

/** 口数 → 月額（円）。 */
export function koToAmount(ko: number): number {
  return ko * KO_UNIT_AMOUNT;
}

/** 月額（円）→ 口数。端数は四捨五入で吸収（既存データの揺れ対策）。 */
export function amountToKo(amount: number): number {
  return Math.max(1, Math.round(amount / KO_UNIT_AMOUNT));
}

/** 「3口」のような口数ラベル。 */
export function formatKoLabel(amount: number): string {
  return `${amountToKo(amount)}口`;
}

/** 「3口（¥300/月）」のような口数＋金額表記。 */
export function formatKo(amount: number): string {
  return `${formatKoLabel(amount)}（¥${koToAmount(amountToKo(amount)).toLocaleString("ja-JP")}/月）`;
}
