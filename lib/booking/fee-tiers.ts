/**
 * 出演依頼のSPOT手数料（円）。演者の受取額（performerFeeAmount）には影響しない、
 * 依頼側（組織者）への上乗せ額。%ではなく段階定額（提案値、要ユーザー確認）。
 */
export function calcBookingPlatformFee(performerFeeAmount: number): number {
  if (performerFeeAmount < 10_000) return 500;
  if (performerFeeAmount <= 50_000) return 1_000;
  return 2_000;
}
