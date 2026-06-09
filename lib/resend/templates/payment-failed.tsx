import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  displayName: string;
  portalUrl: string;
};

export function PaymentFailedEmail({ spotName, displayName, portalUrl }: Props) {
  return (
    <EmailLayout preview={`${spotName}のソシオ料金の支払いに失敗しました`}>
      <Heading style={h1}>お支払いに失敗しました</Heading>
      <Text style={text}>
        {displayName ? `${displayName}さん、` : ""}
        <strong>{spotName}</strong> のソシオ料金のお支払いが正常に処理されませんでした。
      </Text>
      <Text style={text}>
        カード情報をご確認いただき、更新をお願いします。
        お支払いが完了しない場合、ソシオ資格が失効する場合があります。
      </Text>
      <Button href={portalUrl || `${baseUrl}/dashboard`} style={buttonDanger}>
        支払い情報を更新する
      </Button>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
const buttonDanger = {
  backgroundColor: "#dc2626", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
