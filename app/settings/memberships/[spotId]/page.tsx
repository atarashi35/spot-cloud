import { redirect } from "next/navigation";

export default async function LegacySettingsMembershipPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;
  void spotId;
  redirect("/account");
}
