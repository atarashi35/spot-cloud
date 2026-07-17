import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { SocioRankBadge } from "@/components/ui/socio-rank-badge";
import { Spot } from "@/lib/types";
import { isSvgAssetUrl } from "@/lib/utils";

const NEW_BADGE_MONTHS = 3;

function isNewSpot(createdAt: string): boolean {
  const created = new Date(createdAt);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - NEW_BADGE_MONTHS);
  return created > cutoff;
}

export function SpotCard({ spot }: { spot: Spot }) {
  const useRawImage = spot.coverImageUrl ? isSvgAssetUrl(spot.coverImageUrl) : false;
  const showNewBadge = isNewSpot(spot.createdAt);
  const acceptsBookings = Boolean(spot.performerFee) && spot.bookingsEnabled !== false;

  return (
    <Link
      href={`/spots/${spot.id}`}
      className="panel flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_18px_50px_rgba(19,35,28,0.08)] focus:outline-none focus:ring-2 focus:ring-moss/25"
    >
      <div className="relative h-44 w-full">
        {spot.coverImageUrl ? (
          <Image
            alt={spot.name}
            src={spot.coverImageUrl}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={useRawImage}
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${spot.coverTone}`} />
        )}
        {showNewBadge && (
          <span className="absolute left-3 top-3 rounded-full bg-moss px-3 py-1 text-[13px] font-bold tracking-widest text-white uppercase">
            NEW
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="chip">{spot.category}</span>
            {acceptsBookings ? (
              <span className="rounded-full bg-teal-500/15 px-2.5 py-1 text-xs font-semibold text-teal-600">
                出演依頼受付中
              </span>
            ) : null}
          </div>
          <span className="text-sm font-semibold text-ink/68">{spot.prefecture}</span>
        </div>
        <SocioRankBadge socioCount={spot.socioCount} compact />
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold text-ink">{spot.name}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/78">{spot.shortDescription}</p>
        </div>
        <div className="mt-auto space-y-2 border-t border-ink/8 pt-3 text-sm text-ink/72">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{spot.address}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-2xl font-extrabold tabular-nums text-teal-600">{spot.socioCount}</span>
            <span className="text-sm font-semibold text-teal-700/80">人の応援会員</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
