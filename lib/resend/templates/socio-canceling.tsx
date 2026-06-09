import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  displayName: string;
  periodEnd: string; // "2026-07-31" 形式
};

export function SocioCancelingEmail({ spotName, spotId, displayName, periodEnd }: Props) {
  return (
    <EmailLayout preview={`${spotName}のソシオ解約手続きを受け付けました`}>
      <Heading style={h1}>解約手続きを受け付けました</Heading>
      <Text style={text}>
        {displayName ? `${displayName}さん、` : ""}
        <strong>{spotName}</strong> のソシオ解約手続きを受け付けました。
      </Text>
      <Text style={text}>
        現在の請求期間が終了する <strong>{periodEnd}</strong> まで引き続きソシオとして参加できます。
        期日以降は自動的に解約となります。
      </Text>
      <Button href={`${baseUrl}/spots/${spotId}`} style={button}>
        SPOTを見る
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
