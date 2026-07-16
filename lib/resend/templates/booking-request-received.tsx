import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotId: string;
  spotName: string;
  organizerName: string;
  eventDate: string;
  eventLocation: string;
};

export function BookingRequestReceivedEmail({ spotId, spotName, organizerName, eventDate, eventLocation }: Props) {
  return (
    <EmailLayout preview={`【${spotName}】新しい出演依頼が届きました`}>
      <Heading style={h1}>新しい出演依頼が届きました</Heading>
      <Text style={text}>
        <strong>{organizerName}</strong> 様から出演依頼が届いています。
      </Text>
      <Text style={text}>
        希望日: {eventDate}
        <br />
        場所: {eventLocation}
      </Text>
      <Button href={`${baseUrl}/manage/${spotId}/bookings`} style={button}>
        依頼を確認する
      </Button>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
