import { PostForm } from "@/components/owner/post-form";

export default async function EditPostPage({
  params
}: {
  params: Promise<{ spotId: string; postId: string }>;
}) {
  const { spotId, postId } = await params;

  return (
    <div className="shell">
      <section className="mx-auto max-w-3xl panel px-6 py-8 sm:px-8">
        <span className="chip">EDIT POST</span>
        <h1 className="mt-4 text-3xl font-bold text-ink">お知らせを編集</h1>
        <PostForm spotId={spotId} mode="edit" postId={postId} />
      </section>
    </div>
  );
}
