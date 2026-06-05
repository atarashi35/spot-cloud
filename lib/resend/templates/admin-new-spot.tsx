import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  category: string;
  ownerEmail: string;
  prefecture: string;
};

export function AdminNewSpotEmail({ spotName, spotId, category, ownerEmail, prefecture }: Props) {
  return (
    <EmailLayout preview={`新規SPOT登録: ${spotName}`}>
      <Heading style={h1}>新規SPOTが登録されました</Heading>
      <div style={card}>
        <Text style={row}><span style={label}>SPOT名</span>{spotName}</Text>
        <Text style={row}><span style={label}>カテゴリ</span>{category}</Text>
        <Text style={row}><span style={label}>都道府県</span>{prefecture}</Text>
        <Text style={row}><span style={label}>オーナー</span>{ownerEmail}</Text>
      </div>
      <Button href={`${baseUrl}/admin`} style={button}>
        管理画面で確認する
      </Button>
      <Button href={`${baseUrl}/spots/${spotId}`} style={buttonSecondary}>
        SPOTを見る
      </Button>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const card = {
  backgroundColor: "#f5f4f0", borderRadius: "12px",
  padding: "16px 20px", margin: "0 0 24px",
};
const row = { fontSize: "14px", color: "#333", margin: "4px 0" };
const label = { color: "#888", marginRight: "12px", display: "inline-block", width: "90px" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block", marginRight: "12px",
};
const buttonSecondary = {
  backgroundColor: "#fff", color: "#111", borderRadius: "100px",
  padding: "11px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
  border: "1.5px solid #e0dfd9",
};
