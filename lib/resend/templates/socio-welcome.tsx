import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  planAmount: number;
  displayName: string;
};

export function SocioWelcomeEmail({ spotName, spotId, planAmount, displayName }: Props) {
  return (
    <EmailLayout preview={`${spotName}のサポーターになりました`}>
      <Heading style={h1}>サポーター登録が完了しました</Heading>
      <Text style={text}>
        {displayName ? `${displayName}さん、` : ""}はじめまして。{"\n"}
        <strong>{spotName}</strong> のサポーターとして登録が完了しました。
      </Text>
      <Text style={plan}>¥{planAmount.toLocaleString()} / 月</Text>
      <Text style={text}>
        サポーターとして、アンケートや意見投稿を通じてこのSPOTに関わることができます。
        オーナーからのお知らせはメールでお届けします。
      </Text>
      <Button href={`${baseUrl}/spots/${spotId}`} style={button}>
        SPOTを見る
      </Button>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
const plan = {
  fontSize: "20px", fontWeight: "700", color: "#111",
  backgroundColor: "#f5f4f0", borderRadius: "12px",
  padding: "12px 20px", margin: "0 0 20px", display: "inline-block",
};
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
