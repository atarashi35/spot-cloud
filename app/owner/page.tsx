import Link from "next/link";
import { ArrowUpRight, Building2, UserRound } from "lucide-react";

export default function OwnerPage() {
  return (
    <div className="shell py-10">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">SPOTを作る</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/owner/spots/new?kind=creator" className="group flex min-h-24 items-center gap-4 rounded-2xl bg-white px-5 py-5 transition hover:text-moss">
            <UserRound className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-base font-bold">クリエイター</span>
            <ArrowUpRight className="h-5 w-5 text-ink/45 group-hover:text-moss" aria-hidden="true" />
          </Link>
          <Link href="/owner/spots/new?kind=organization" className="group flex min-h-24 items-center gap-4 rounded-2xl bg-white px-5 py-5 transition hover:text-moss">
            <Building2 className="h-6 w-6 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-base font-bold">団体</span>
            <ArrowUpRight className="h-5 w-5 text-ink/45 group-hover:text-moss" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
