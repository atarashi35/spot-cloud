import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  socioName: string;
  socioAffiliation: string;
  planAmount: number;
  totalSocios: number;
};

export function OwnerNewSocioEmail({
  spotName, spotId, socioName, socioAffiliation, planAmount, totalSocios,
}: Props) {
  return (
    <EmailLayout preview={`新しいソシオが加入しました — ${spotName}`}>
      <Heading style={h1}>新しいソシオが加入しました 🎉</Heading>
      <Text style={text}>
        <strong>{spotName}</strong> に新しいソシオが加入しました。
      </Text>
      <div style={card}>
        <Text style={cardRow}><span style={label}>名前</span>{socioName || "—"}</Text>
        {socioAffiliation && (
          <Text style={cardRow}><span style={label}>所属</span>{socioAffiliation}</Text>
        )}
        <Text style={cardRow}><span style={label}>プラン</span>¥{planAmount.toLocaleString()} / 月</Text>
        <Text style={cardRow}><span style={label}>累計ソシオ数</span>{totalSocios} 人</Text>
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
  padding: "16px 20px", margin: "0 0 24px",
};
const cardRow = { fontSize: "14px", color: "#333", margin: "4px 0" };
const label = { color: "#888", marginRight: "12px", display: "inline-block", width: "100px" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
