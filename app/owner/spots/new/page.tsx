import { SpotForm } from "@/components/owner/spot-form";
import { SpotKind } from "@/lib/types";

export default async function NewSpotPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const initialKind: SpotKind = kind === "organization" ? "organization" : "creator";
  const label = initialKind === "creator" ? "クリエイター" : "団体";
  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">NEW SPOT</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">{label}登録</h1>
        <p className="mt-2 text-sm text-ink/68">{label}の公開ページを作り、サポーターを受け付けます。</p>
        <SpotForm mode="create" initialKind={initialKind} />
      </section>
    </div>
  );
}
