import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotId: string;
  eventTitle: string;
  applicantName: string;
};

export function EventApplicationReceivedEmail({ spotId, eventTitle, applicantName }: Props) {
  return (
    <EmailLayout preview={`新しい参加申込が届きました: ${eventTitle}`}>
      <Heading style={h1}>新しい参加申込が届きました</Heading>
      <Text style={text}>
        <strong>{applicantName}</strong> さんから「{eventTitle}」への参加申込が届いています。承認するまで参加は確定しません。
      </Text>
      <Button href={`${baseUrl}/manage/${spotId}/events`} style={button}>
        申込を確認する
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
