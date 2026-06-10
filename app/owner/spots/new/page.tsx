import { SpotForm } from "@/components/owner/spot-form";

export default function NewSpotPage() {
  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">NEW SPOT</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">SPOT を登録する</h1>
        <SpotForm mode="create" />
      </section>
    </div>
  );
}
