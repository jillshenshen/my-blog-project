import "server-only";
import type { Comment, CommentThread } from "@/lib/types/comment";
import { getSupabaseServer } from "@/lib/supabase/server";

type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_avatar: string | null;
  verified: boolean;
  content: string;
  created_at: string;
};

// 注意：刻意不選 author_email / user_id，避免在公開查詢中外洩
const PUBLIC_COMMENT_SELECT =
  "id, post_id, parent_id, author_name, author_avatar, verified, content, created_at";

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    verified: row.verified,
    content: row.content,
    createdAt: row.created_at,
  };
}

// 取得單篇文章的留言並組成 root + replies（限一層）
export async function getCommentsForPost(
  postId: string,
): Promise<CommentThread[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("comments")
    .select(PUBLIC_COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  // migration 還沒跑時：comments 表 / 新欄位不存在 → 退回空陣列，不阻擋 build
  // 42P01 = relation does not exist；42703 = column does not exist；PGRST205 = schema cache miss
  if (error) {
    if (
      error.code === "PGRST205" ||
      error.code === "42P01" ||
      error.code === "42703"
    )
      return [];
    throw error;
  }

  const all = (data as unknown as CommentRow[]).map(mapComment);
  const roots: CommentThread[] = [];
  const byId = new Map<string, CommentThread>();

  // 先放 roots（parent_id = null）
  for (const c of all) {
    if (c.parentId === null) {
      const thread: CommentThread = { ...c, replies: [] };
      roots.push(thread);
      byId.set(c.id, thread);
    }
  }

  // 再把 reply 掛到對應的 root；若 parent 不是 root（理論上不會發生）則略過
  for (const c of all) {
    if (c.parentId !== null) {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(c);
    }
  }

  return roots;
}

// 計算留言數（含 root + reply）給文章列表用
export async function getCommentCount(postId: string): Promise<number> {
  const supabase = getSupabaseServer();
  const { count, error } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw error;
  return count ?? 0;
}
