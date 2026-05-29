import { SpotForm } from "@/components/owner/spot-form";

export default async function EditSpotPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">EDIT SPOT</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">SPOT を編集</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          公開内容を整えたあと、加入受付を始める前に受取設定も確認してください。
        </p>
        <SpotForm mode="edit" spotId={spotId} />
      </section>
    </div>
  );
}
