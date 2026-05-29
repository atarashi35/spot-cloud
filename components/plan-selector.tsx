import Link from "next/link";
import { planOptions } from "@/lib/types";

export function PlanSelector({ spotId }: { spotId: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {planOptions.map((amount) => (
        <div key={amount} className="rounded-[24px] border border-ink/10 bg-mist p-4">
          <div className="text-xs font-semibold tracking-[0.2em] text-ink/55">MONTHLY</div>
          <div className="mt-2 text-3xl font-bold text-ink">¥{amount}</div>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            高額支援ではなく、ゆるく続く所属をつくるための固定プラン。
          </p>
          <Link href={`/spots/${spotId}/join?plan=${amount}`} className="cta-primary mt-5 w-full">
            この金額でソシオになる
          </Link>
        </div>
      ))}
    </div>
  );
}
