import Image from "next/image";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { SocioRankBadge } from "@/components/ui/socio-rank-badge";
import { Spot } from "@/lib/types";

export function SpotCard({ spot }: { spot: Spot }) {
  return (
    <Link
      href={`/spots/${spot.id}`}
      className="panel block overflow-hidden transition hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_18px_50px_rgba(19,35,28,0.08)] focus:outline-none focus:ring-2 focus:ring-moss/25"
    >
      {/* カバー画像: next/image でリサイズ・WebP・lazy load を自動適用 */}
      <div className="relative h-44 w-full">
        {spot.coverImageUrl ? (
          <Image
            alt={spot.name}
            src={spot.coverImageUrl}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${spot.coverTone}`} />
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="chip">{spot.category}</span>
          <span className="text-sm font-semibold text-ink/55">{spot.prefecture}</span>
        </div>
        <SocioRankBadge socioCount={spot.socioCount} compact />
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
      </div>
    </Link>
  );
}
