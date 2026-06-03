import { PostDetailClient } from "@/components/spots/post-detail-client";

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ spotId: string; postId: string }>;
}) {
  const { spotId, postId } = await params;
  return <PostDetailClient spotId={spotId} postId={postId} />;
}
