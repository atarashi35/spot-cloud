import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

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
    <EmailLayout preview={`${spotName}から「${eventTitle}」への招待が届きました`}>
      <Heading style={h1}>イベントに招待されました</Heading>
      <Text style={text}>
        {displayName ? `${displayName}さん、` : ""}
        <strong>{spotName}</strong> から「{eventTitle}」への招待が届いています。SPOTのアカウント作成（無料）だけで参加を確定できます。
      </Text>
      <div style={card}>
        <Text style={eventTitleStyle}>{eventTitle}</Text>
        {eventStartAt && <Text style={detailRow}>📅 {eventStartAt}</Text>}
        {eventLocation && <Text style={detailRow}>📍 {eventLocation}</Text>}
      </div>
      <Button href={`${baseUrl}/spots/${spotId}/events/${eventId}/invite/${inviteId}`} style={button}>
        招待を確認して参加する
      </Button>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
const card = {
  backgroundColor: "#f5f4f0", borderRadius: "12px",
  padding: "20px 24px", margin: "0 0 24px",
};
const eventTitleStyle = { fontSize: "16px", fontWeight: "700", color: "#111", margin: "0 0 12px" };
const detailRow = { fontSize: "14px", color: "#555", margin: "4px 0" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
