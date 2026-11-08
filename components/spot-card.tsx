import Image from "next/image";
import Link from "next/link";
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

  return (
    <Link
      href={`/spots/${spot.id}`}
      className="group flex flex-col overflow-hidden focus:outline-none focus:ring-2 focus:ring-moss/25"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-mist">
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
      <div className="flex flex-1 flex-col gap-2 px-1 py-4">
        <p className="text-xs font-semibold text-moss">{spot.kind === "creator" ? "クリエイター" : "団体"} · {spot.category}{spot.prefecture ? ` · ${spot.prefecture}` : ""}</p>
        <h3 className="text-xl font-bold text-ink group-hover:text-moss">{spot.name}</h3>
        {spot.shortDescription ? <p className="line-clamp-2 text-sm leading-6 text-ink/65">{spot.shortDescription}</p> : null}
        <p className="mt-auto pt-1 text-xs text-ink/55">{spot.socioCount + (spot.followerCount ?? 0)}人のサポーター</p>
      </div>
    </Link>
  );
}
