import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { EmailLayout } from "./layout";

type Props = {
  spotName: string;
  organizerName: string;
  performerFeeAmount: number;
  eventDate: string;
  /** true: 演者向け（送金タイミングの注記を含む）。false: 組織者向け。 */
  forPerformer: boolean;
};

export function BookingPaidEmail({ spotName, organizerName, performerFeeAmount, eventDate, forPerformer }: Props) {
  return (
    <EmailLayout preview={`出演依頼のお支払いが完了しました`}>
      <Heading style={h1}>お支払いが完了しました</Heading>
      {forPerformer ? (
        <>
          <Text style={text}>
            <strong>{organizerName}</strong> 様からの出演依頼（{eventDate}）のお支払いが完了しました。
          </Text>
          <Text style={text}>
            出演料 <strong>¥{performerFeeAmount.toLocaleString()}</strong>（満額）は、SPOTの四半期送金バッチにて
            お手持ちの口座へお振込みします。振込までにお時間をいただく場合がありますので、あらかじめご了承ください。
          </Text>
        </>
      ) : (
        <Text style={text}>
          <strong>{spotName}</strong> への出演依頼（{eventDate}）のお支払いが完了しました。当日はどうぞよろしくお願いいたします。
        </Text>
      )}
    </EmailLayout>
  );
}

const h1 = { fontSize: "22px", fontWeight: "700", color: "#111", margin: "0 0 16px" };
const text = { fontSize: "14px", lineHeight: "1.8", color: "#444", margin: "0 0 16px" };
