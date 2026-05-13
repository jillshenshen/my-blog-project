import "server-only";
import type { AdminComment } from "@/lib/types/comment";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AdminCommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  author_avatar: string | null;
  verified: boolean;
  user_id: string | null;
  content: string;
  created_at: string;
  post: { slug: string; title: string };
};

const ADMIN_COMMENT_SELECT = `
  id, post_id, parent_id,
  author_name, author_email, author_avatar, verified, user_id,
  content, created_at,
  post:posts!inner(slug, title)
`;

function mapAdminComment(row: AdminCommentRow): AdminComment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    authorAvatar: row.author_avatar,
    verified: row.verified,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    postSlug: row.post.slug,
    postTitle: row.post.title,
  };
}

export async function getAllCommentsForAdmin(): Promise<AdminComment[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("comments")
    .select(ADMIN_COMMENT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as AdminCommentRow[]).map(mapAdminComment);
}
