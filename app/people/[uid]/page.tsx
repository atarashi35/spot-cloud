import { notFound } from "next/navigation";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { getPublicProfile } from "@/lib/server/public-profiles";

export default async function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const profile = await getPublicProfile(uid);
  if (!profile || profile.status !== "approved") notFound();

  return (
    <div className="shell py-10">
      <main className="panel mx-auto max-w-3xl px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={112} height={112} className="h-28 w-28 rounded-full object-cover" /> : <div className="flex h-28 w-28 items-center justify-center rounded-full bg-mist text-3xl font-bold text-ink/45">{profile.name.slice(0, 1)}</div>}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-moss">{profile.kind === "creator" ? "クリエイター" : "団体"}</p>
            <h1 className="mt-2 text-3xl font-extrabold text-ink">{profile.name}</h1>
            {profile.prefecture || profile.city ? <p className="mt-2 text-sm text-ink/60">{profile.prefecture}{profile.city ? ` / ${profile.city}` : ""}</p> : null}
          </div>
        </div>
        <p className="mt-8 whitespace-pre-wrap text-[15px] leading-8 text-ink/80">{profile.bio}</p>
        {profile.fields.length ? <div className="mt-6 flex flex-wrap gap-2">{profile.fields.map((field) => <span key={field} className="chip">{field}</span>)}</div> : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {profile.websiteUrl ? <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="cta-secondary text-sm"><ExternalLink className="mr-2 h-4 w-4" />Webサイト</a> : null}
          {profile.instagramUrl ? <a href={profile.instagramUrl} target="_blank" rel="noreferrer" className="cta-secondary text-sm"><ExternalLink className="mr-2 h-4 w-4" />Instagram</a> : null}
        </div>
      </main>
    </div>
  );
}
