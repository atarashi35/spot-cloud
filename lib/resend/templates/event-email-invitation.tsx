import { Button, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";
import { formatEventDateTime } from "../format-event-date";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotId: string;
  eventId: string;
  inviteId: string;
  spotName: string;
  eventTitle: string;
  eventStartAt: string;
  eventLocation?: string;
  displayName?: string;
};

export function EventEmailInvitationEmail({
  spotId, eventId, inviteId, spotName, eventTitle, eventStartAt, eventLocation, displayName
}: Props) {
  return (
    <EmailLayout preview={`${spotName}より「${eventTitle}」へご招待申し上げます`}>
      <Text style={eyebrow}>I N V I T A T I O N</Text>
      <Text style={heading}>ご 招 待</Text>

      <Text style={greeting}>{displayName ? `${displayName} 様` : "ご招待"}</Text>
      <Text style={text}>
        <strong>{spotName}</strong> より「{eventTitle}」への招待状をお届けいたします。
        ご都合がよろしければ、ぜひお越しくださいませ。
      </Text>

      <div style={card}>
        <Text style={eventTitleStyle}>{eventTitle}</Text>
        <div style={divider} />
        {eventStartAt && (
          <div style={detailRow}>
            <Text style={detailLabel}>日時</Text>
            <Text style={detailValue}>{formatEventDateTime(eventStartAt)}</Text>
          </div>
        )}
        {eventLocation && (
          <div style={detailRow}>
            <Text style={detailLabel}>場所</Text>
            <Text style={detailValue}>{eventLocation}</Text>
          </div>
        )}
      </div>

      <Text style={note}>
        参加確定には無料のアカウント作成のみが必要です。応援会員登録（月額課金）は求めません。
      </Text>

      <div style={buttonWrap}>
        <Button href={`${baseUrl}/spots/${spotId}/events/${eventId}/invite/${inviteId}`} style={button}>
          招待状を確認する
        </Button>
      </div>

      <Text style={closing}>皆様のお越しを、心よりお待ち申し上げております。</Text>
      <Text style={signature}>{spotName}</Text>
    </EmailLayout>
  );
}

const serif = "'Hiragino Mincho ProN', 'Yu Mincho', 'Times New Roman', serif";

const eyebrow = {
  fontSize: "11px", letterSpacing: "3px", color: "#9a9689",
  textAlign: "center" as const, margin: "0 0 4px", fontWeight: "600",
};
const heading = {
  fontFamily: serif, fontSize: "28px", letterSpacing: "6px", fontWeight: "700",
  color: "#111", textAlign: "center" as const, margin: "0 0 28px",
};
const greeting = {
  fontFamily: serif, fontSize: "16px", fontWeight: "700", color: "#111",
  textAlign: "center" as const, margin: "0 0 16px",
};
const text = {
  fontSize: "14px", lineHeight: "1.9", color: "#444",
  textAlign: "center" as const, margin: "0 0 28px",
};
const card = {
  border: "1px solid #e2ded2", borderRadius: "4px",
  padding: "28px 24px", margin: "0 0 20px", textAlign: "center" as const,
};
const eventTitleStyle = {
  fontFamily: serif, fontSize: "18px", fontWeight: "700", color: "#111", margin: "0 0 16px",
};
const divider = { width: "40px", height: "1px", backgroundColor: "#d8d3c4", margin: "0 auto 16px" };
const detailRow = { margin: "0 0 12px" };
const detailLabel = {
  fontSize: "10px", letterSpacing: "2px", color: "#9a9689", margin: "0 0 2px",
};
const detailValue = { fontSize: "14px", color: "#333", margin: "0" };
const note = { fontSize: "12px", lineHeight: "1.8", color: "#8a8a8a", textAlign: "center" as const, margin: "0 0 24px" };
const buttonWrap = { textAlign: "center" as const, margin: "0 0 32px" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 32px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
const closing = {
  fontSize: "13px", color: "#666", textAlign: "center" as const, margin: "0 0 4px",
};
const signature = {
  fontFamily: serif, fontSize: "14px", fontWeight: "700", color: "#111",
  textAlign: "center" as const, margin: "0",
};
