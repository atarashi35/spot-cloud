import { PostForm } from "@/components/owner/post-form";

export default async function NewPostPage({
  params
}: {
  params: Promise<{ spotId: string }>;
}) {
  const { spotId } = await params;

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">OWNER POST</span>
        <h1 className="mt-4 text-3xl font-extrabold text-ink">投稿を作成</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/78">
          投稿は応援会員限定で公開されます。
        </p>
        <PostForm spotId={spotId} mode="create" />
      </section>
    </div>
  );
}
