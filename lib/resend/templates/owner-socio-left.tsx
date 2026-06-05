import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  socioName: string;
  totalSocios: number;
};

export function OwnerSocioLeftEmail({ spotName, spotId, socioName, totalSocios }: Props) {
  return (
    <EmailLayout preview={`ソシオが解約しました — ${spotName}`}>
      <Heading style={h1}>ソシオが解約しました</Heading>
      <Text style={text}>
        <strong>{spotName}</strong> のソシオ <strong>{socioName || "メンバー"}</strong> さんが解約しました。
      </Text>
      <Text style={text}>
        現在のソシオ数：<strong>{totalSocios} 人</strong>
      </Text>
      <Button href={`${baseUrl}/owner/spots/${spotId}`} style={button}>
        管理画面を開く
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
