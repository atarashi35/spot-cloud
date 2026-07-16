import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

type Props = {
  spotName: string;
  organizerName: string;
  declineReason?: string;
};

export function BookingDeclinedEmail({ spotName, organizerName, declineReason }: Props) {
  return (
    <EmailLayout preview={`${spotName}が出演依頼を辞退しました`}>
      <Heading style={h1}>出演依頼について</Heading>
      <Text style={text}>
        {organizerName} 様
        <br />
        大変申し訳ございませんが、<strong>{spotName}</strong> は今回の出演依頼を辞退させていただきます。
      </Text>
      {declineReason ? <Text style={text}>理由: {declineReason}</Text> : null}
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
