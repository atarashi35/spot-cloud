import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Spot } from "@/lib/types";

export function SpotCard({ spot }: { spot: Spot }) {
  return (
    <article className="panel overflow-hidden">
      {spot.coverImageUrl ? (
        <img
          alt={spot.name}
          className="h-44 w-full object-cover"
          src={spot.coverImageUrl}
        />
      ) : (
        <div className={`h-44 bg-gradient-to-br ${spot.coverTone}`} />
      )}
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="chip">{spot.category}</span>
          <span className="text-sm font-semibold text-ink/55">{spot.prefecture}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-ink">{spot.name}</h3>
          <p className="mt-2 text-sm leading-7 text-ink/68">{spot.shortDescription}</p>
        </div>
        <div className="space-y-2 text-sm text-ink/60">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{spot.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{spot.socioCount} 人のソシオ</span>
          </div>
        </div>
        <Link href={`/spots/${spot.id}`} className="cta-secondary w-full">
          詳細を見る
        </Link>
      </div>
    </article>
  );
}
