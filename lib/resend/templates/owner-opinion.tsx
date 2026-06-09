import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  question: string;
  answer: string;
  socioName: string;
};

export function OwnerOpinionEmail({ spotName, spotId, question, answer, socioName }: Props) {
  return (
    <EmailLayout preview={`${spotName}に新しい意見が届きました`}>
      <Heading style={h1}>新しい意見が届きました</Heading>
      <Text style={text}>
        <strong>{spotName}</strong> のソシオから意見が投稿されました。
      </Text>
      <div style={card}>
        <Text style={questionText}>{question}</Text>
        <Text style={answerText}>{answer}</Text>
        <Text style={meta}>— {socioName || "匿名"}</Text>
      </div>
      <Button href={`${baseUrl}/owner/spots/${spotId}`} style={button}>
        管理画面を開く
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
const questionText = { fontSize: "12px", color: "#888", margin: "0 0 8px" };
const answerText = { fontSize: "15px", color: "#111", lineHeight: "1.7", margin: "0 0 12px" };
const meta = { fontSize: "12px", color: "#aaa", margin: "0" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
