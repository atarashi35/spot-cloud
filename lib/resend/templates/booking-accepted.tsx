import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spotcloud.app";

type Props = {
  spotId: string;
  bookingRequestId: string;
  spotName: string;
  organizerName: string;
  totalAmount: number;
};

export function BookingAcceptedEmail({ spotId, bookingRequestId, spotName, organizerName, totalAmount }: Props) {
  return (
    <EmailLayout preview={`${spotName}が出演依頼を受諾しました`}>
      <Heading style={h1}>出演依頼が受諾されました</Heading>
      <Text style={text}>
        {organizerName} 様
        <br />
        <strong>{spotName}</strong> が出演依頼を受諾しました。以下より、お支払い手続きにお進みください。
      </Text>
      <Text style={text}>
        お支払い金額: <strong>¥{totalAmount.toLocaleString()}</strong>（出演料＋SPOT手数料込み）
      </Text>
      <Button href={`${baseUrl}/booking/${spotId}/${bookingRequestId}`} style={button}>
        支払いへ進む
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
