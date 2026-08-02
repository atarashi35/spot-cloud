/**
 * 機能凍結フラグ。
 *
 * アンケート（投票・意見箱）は、書店ICP検証（Day90ゲート: 総サポーター300人・
 * 3ヶ月残存90%・1店50人）を通過するまで凍結。導線を非表示にするのみで、
 * コードは削除しない。解凍はこのフラグを true に戻すだけで完了する。
 *
 * イベントは、招待/承認制の茶会（ハイエース茶室等）検証のため解凍（2026-07-30）。
 * FEATURE_BOOKINGSと同じく限定的な実運用検証として true。
 */
export const FEATURE_EVENTS = true;
export const FEATURE_VOICES = false;

/**
 * 出演依頼機能。1〜3件の実演者アカウントで検証中は true にして限定公開、
 * 検証前は false で導線を隠す（コードは残す）。
 */
export const FEATURE_BOOKINGS = true;
