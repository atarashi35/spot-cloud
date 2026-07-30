import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

type Props = {
  spotName: string;
  eventTitle: string;
  applicantName: string;
};

export function EventApplicationDeclinedEmail({ spotName, eventTitle, applicantName }: Props) {
  return (
    <EmailLayout preview={`${eventTitle}の参加申込について`}>
      <Heading style={h1}>参加申込について</Heading>
      <Text style={text}>
        {applicantName ? `${applicantName}さん、` : ""}
        大変申し訳ございませんが、<strong>{spotName}</strong>「{eventTitle}」への参加申込は今回見送りとさせていただきました。
      </Text>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
