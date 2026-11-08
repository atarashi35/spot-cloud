import { SpotForm } from "@/components/owner/spot-form";
import { SpotBreadcrumb } from "@/components/owner/spot-breadcrumb";

export default async function EditSpotPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <SpotBreadcrumb spotId={spotId} current="SPOT編集" />
        <h1 className="mt-4 text-3xl font-extrabold text-ink">SPOT を編集</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/78">
          月額サポートを受け付ける場合は、受取設定も確認してください。
        </p>
        <SpotForm mode="edit" spotId={spotId} />
      </section>
    </div>
  );
}
