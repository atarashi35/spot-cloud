import { MemberPageClient } from "@/components/spots/member-page-client";

export default async function MemberPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;
  return <MemberPageClient spotId={spotId} />;
}
