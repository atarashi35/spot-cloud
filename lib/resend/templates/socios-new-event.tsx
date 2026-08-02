import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;   // "2026年7月10日（木）18:00"
  eventPlace: string;
  displayName: string;
};

export function SociosNewEventEmail({
  spotName, spotId, eventId, eventTitle, eventDate, eventPlace, displayName,
}: Props) {
  return (
    <EmailLayout preview={`${spotName}で新しいイベントが開催されます`}>
      <Heading style={h1}>{spotName}のイベント情報</Heading>
      <Text style={text}>
        {displayName ? `${displayName}さん、` : ""}サポーターとして参加されている <strong>{spotName}</strong> で新しいイベントが企画されました。
      </Text>
      <div style={card}>
        <Text style={eventTitleStyle}>{eventTitle}</Text>
        <Text style={detailRow}>📅 {eventDate}</Text>
        {eventPlace && <Text style={detailRow}>📍 {eventPlace}</Text>}
      </div>
      <Button href={`${baseUrl}/spots/${spotId}?event=${eventId}`} style={button}>
        イベントを見る
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
