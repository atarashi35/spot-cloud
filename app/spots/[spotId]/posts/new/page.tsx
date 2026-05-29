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
        <h1 className="mt-4 text-3xl font-bold text-ink">お知らせを作成</h1>
        <p className="mt-3 text-sm leading-7 text-ink/68">
          投稿はソシオ限定で公開されます。MVP ではまず Firestore への登録フォームを優先します。
        </p>
        <PostForm spotId={spotId} mode="create" />
      </section>
    </div>
  );
}
