/** イベントをGoogleカレンダー追加リンク・.ics形式に変換するユーティリティ（クライアント/サーバー両対応の純関数）。 */

type CalendarEventInput = {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
};

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function resolveEnd(startAt: string, endAt?: string): string {
  if (endAt) return endAt;
  const start = new Date(startAt);
  return new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString();
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const end = resolveEnd(event.startAt, event.endAt);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(event.startAt)}/${toIcsDate(end)}`,
    details: event.description ?? "",
    location: event.location ?? ""
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(event: CalendarEventInput): string {
  const end = resolveEnd(event.startAt, event.endAt);
  const escape = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SPOT//events//JA",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID?.() ?? `${Date.now()}@spotcloud.app`}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startAt)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : undefined,
    event.location ? `LOCATION:${escape(event.location)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR"
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function buildIcsDataUrl(event: CalendarEventInput): string {
  const content = buildIcsContent(event);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}
