import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

type Props = {
  spotName: string;
  eventTitle: string;
  applicantName: string;
};

export function EventWaitlistedEmail({ spotName, eventTitle, applicantName }: Props) {
  return (
    <EmailLayout preview={`${eventTitle}はキャンセル待ちです`}>
      <Heading style={h1}>キャンセル待ちで登録しました</Heading>
      <Text style={text}>
        {applicantName ? `${applicantName}さん、` : ""}
        <strong>{spotName}</strong>「{eventTitle}」は定員に達しているため、キャンセル待ちで登録しました。空きが出た場合、自動的に参加確定となりご連絡します。
      </Text>
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
