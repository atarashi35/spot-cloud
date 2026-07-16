/**
 * 機能凍結フラグ。
 *
 * イベント・アンケート（投票・意見箱）は、書店ICP検証（Day90ゲート: 総会員300人・
 * 3ヶ月残存90%・1店50人）を通過するまで凍結。導線を非表示にするのみで、
 * コードは削除しない。解凍はこのフラグを true に戻すだけで完了する。
 */
export const FEATURE_EVENTS = false;
export const FEATURE_VOICES = false;

/**
 * 出演依頼機能。1〜3件の実演者アカウントで検証中は true にして限定公開、
 * 検証前は false で導線を隠す（コードは残す）。
 */
export const FEATURE_BOOKINGS = false;
