import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spotcloud.app";

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="ja">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* ロゴ */}
          <Section style={logoSection}>
            <Img
              src={`${baseUrl}/spot_logo_horizontal.svg`}
              alt="SPOT"
              height={24}
            />
          </Section>

          {/* コンテンツ */}
          {children}

          {/* フッター */}
          <Hr style={hr} />
          <Text style={footer}>
            © 2026 SPOT. このメールは自動送信です。{"\n"}
            配信停止は設定ページから行えます。
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f5f4f0",
  fontFamily: "'Hiragino Sans', 'Yu Gothic', 'Helvetica Neue', Arial, sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px 32px",
  borderRadius: "20px",
  maxWidth: "520px",
};

const logoSection = {
  marginBottom: "32px",
};

const hr = {
  borderColor: "#e8e7e3",
  margin: "32px 0 16px",
};

const footer = {
  color: "#aaa",
  fontSize: "11px",
  lineHeight: "1.6",
};
