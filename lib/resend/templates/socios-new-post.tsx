import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spotcloud.app";

type Props = {
  spotName: string;
  spotId: string;
  postTitle: string;
  postBody: string;
  displayName: string;
};

export function SociosNewPostEmail({ spotName, spotId, postTitle, postBody, displayName }: Props) {
  return (
    <EmailLayout preview={`${spotName}から新しいお知らせが届きました`}>
      <Heading style={h1}>{spotName}からのお知らせ</Heading>
      <Text style={text}>
        {displayName ? `${displayName}さん、` : ""}ソシオとして参加されている <strong>{spotName}</strong> から新しいお知らせが届きました。
      </Text>
      <div style={card}>
        <Text style={postTitleStyle}>{postTitle}</Text>
        <Text style={postBodyStyle}>{postBody.length > 200 ? `${postBody.slice(0, 200)}…` : postBody}</Text>
      </div>
      <Button href={`${baseUrl}/spots/${spotId}`} style={button}>
        SPOTを見る
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
const postTitleStyle = { fontSize: "16px", fontWeight: "700", color: "#111", margin: "0 0 10px" };
const postBodyStyle = { fontSize: "14px", lineHeight: "1.7", color: "#555", margin: "0" };
const button = {
  backgroundColor: "#111", color: "#fff", borderRadius: "100px",
  padding: "12px 28px", fontSize: "14px", fontWeight: "600",
  textDecoration: "none", display: "inline-block",
};
