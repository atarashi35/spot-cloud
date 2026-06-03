import { SocioManageClient } from "@/components/owner/socio-manage-client";
import { PageShell } from "@/components/ui/page-shell";

export default async function SociosPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <PageShell className="space-y-6">
      <SocioManageClient spotId={spotId} />
    </PageShell>
  );
}
