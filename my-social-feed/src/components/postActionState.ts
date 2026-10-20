import type { Post } from "@/types/post";
import { hasExpandableMetadata } from "@/components/PostMetadataExpansion";

/** The state half of PostActions' props, read from a post: who posted it,
    its media, what the viewer has done to it, and its counts. Spread it and
    add the handlers: <PostActions {...postActionState(post)} index={i} ... />.
    (Three components each spelled this out by hand.) */
export function postActionState(post: Post) {
  return {
    postId: post.id,
    posterUsername: post.username,
    videoUrl: post.video_url || undefined,
    audioUrl: post.audio_url || undefined,
    likedByMe: post.liked_by_me,
    repostedByMe: post.reposted_by_me,
    savedByMe: post.saved_by_me,
    laughedByMe: post.laughed_by_me,
    counts: {
      likes: post.likes,
      reposts: post.reposts,
      shares: post.shares,
      saves: post.saves,
      laughs: post.laughs ?? 0,
      replies: post.replies_count ?? 0,
      quotes: post.quotes_count ?? 0,
      slop: post.slop_count ?? 0,
    },
    hasMetadata: hasExpandableMetadata(post.post_metadata),
    captureElementId: `post-${post.id}`,
  };
}
