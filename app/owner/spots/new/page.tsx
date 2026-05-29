import { SpotForm } from "@/components/owner/spot-form";

export default function NewSpotPage() {
  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">NEW SPOT</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">SPOT を登録する</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          まずは運営者が自力で公開ページを整えられることを MVP の最優先とします。
        </p>
        <SpotForm mode="create" />
      </section>
    </div>
  );
}
