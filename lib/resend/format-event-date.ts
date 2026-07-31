/** メールテンプレート用に日時を「2026年8月8日(土) 19:00」形式へ整形する。 */
export function formatEventDateTime(iso: string): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${weekday}) ${hh}:${mm}`;
}
