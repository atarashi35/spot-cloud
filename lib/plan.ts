const LEGACY_KO_UNIT_AMOUNT = 100;

/**
 * レガシー互換: 2026-07以前の月額・口数制（1口=¥100の自由金額）で加入した
 * 既存会員の表示用。新規登録は年会費3コース制（lib/types.tsのCOURSE_AMOUNTS）を使うため、
 * これらは新規フローからは呼ばれない。
 */

/** 口数 → 月額（円）。 */
export function koToAmount(ko: number): number {
  return ko * LEGACY_KO_UNIT_AMOUNT;
}

/** 月額（円）→ 口数。端数は四捨五入で吸収（既存データの揺れ対策）。 */
export function amountToKo(amount: number): number {
  return Math.max(1, Math.round(amount / LEGACY_KO_UNIT_AMOUNT));
}

/** 「3口」のような口数ラベル。 */
export function formatKoLabel(amount: number): string {
  return `${amountToKo(amount)}口`;
}

/** 「3口（¥300/月）」のような口数＋金額表記。 */
export function formatKo(amount: number): string {
  return `${formatKoLabel(amount)}（¥${koToAmount(amountToKo(amount)).toLocaleString("ja-JP")}/月）`;
}

/** 「¥5,000コース」のような年会費コース表記。 */
export function formatCourseLabel(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}コース`;
}
