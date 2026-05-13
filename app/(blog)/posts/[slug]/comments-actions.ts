"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSupabaseServerWithAuth } from "@/lib/supabase/server-auth";

// 簡單 email 格式檢查（避免引入 zod）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_NAME = 50;
const MAX_EMAIL = 200;
const MAX_CONTENT = 2000;

export type CreateCommentResult =
  | { ok: true }
  | { ok: false; error: string };

type Identity =
  | {
      kind: "verified";
      userId: string;
      name: string;
      email: string;
      avatar: string | null;
    }
  | {
      kind: "anonymous";
      name: string;
      email: string;
    };

export async function createCommentAction(
  postSlug: string,
  parentId: string | null,
  formData: FormData,
): Promise<CreateCommentResult> {
  // honeypot：機器人通常會填這個隱藏欄位
  const honey = String(formData.get("website") ?? "").trim();
  if (honey) return { ok: true }; // 假裝成功，不寫入

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { ok: false, error: "請輸入留言內容" };
  if (content.length > MAX_CONTENT)
    return { ok: false, error: `留言內容超過 ${MAX_CONTENT} 字` };

  // 解析身份：有 Supabase auth user → verified；否則走表單匿名
  const authClient = await getSupabaseServerWithAuth();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  let identity: Identity;
  if (user) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName =
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      user.email?.split("@")[0] ||
      "Google User";
    const avatar =
      (meta.avatar_url as string | undefined) ||
      (meta.picture as string | undefined) ||
      null;
    identity = {
      kind: "verified",
      userId: user.id,
      name: fullName,
      email: user.email ?? "",
      avatar,
    };
  } else {
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    if (!name) return { ok: false, error: "請輸入暱稱" };
    if (name.length > MAX_NAME) return { ok: false, error: "暱稱太長" };
    if (!email) return { ok: false, error: "請輸入 Email" };
    if (email.length > MAX_EMAIL || !EMAIL_RE.test(email))
      return { ok: false, error: "Email 格式錯誤" };
    identity = { kind: "anonymous", name, email };
  }

  const supabase = getSupabaseAdmin();

  // 先解 slug 到 post id，並確保文章已發布
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, published, published_at, slug")
    .eq("slug", postSlug)
    .maybeSingle();

  if (postErr) return { ok: false, error: postErr.message };
  if (!post) return { ok: false, error: "找不到文章" };
  if (
    !post.published ||
    !post.published_at ||
    new Date(post.published_at).getTime() > Date.now()
  ) {
    return { ok: false, error: "這篇文章尚未公開" };
  }

  // 一層 reply 限制：parentId 必須是 root（parent_id IS NULL）
  if (parentId) {
    const { data: parent, error: parentErr } = await supabase
      .from("comments")
      .select("id, post_id, parent_id")
      .eq("id", parentId)
      .maybeSingle();
    if (parentErr) return { ok: false, error: parentErr.message };
    if (!parent || parent.post_id !== post.id) {
      return { ok: false, error: "回覆對象不存在" };
    }
    if (parent.parent_id !== null) {
      return { ok: false, error: "只能回覆一層留言" };
    }
  }

  const insertRow = {
    post_id: post.id,
    parent_id: parentId,
    user_id: identity.kind === "verified" ? identity.userId : null,
    author_name: identity.name,
    author_email: identity.email,
    author_avatar: identity.kind === "verified" ? identity.avatar : null,
    verified: identity.kind === "verified",
    content,
  };

  const { error: insertErr } = await supabase
    .from("comments")
    .insert(insertRow);

  if (insertErr) return { ok: false, error: insertErr.message };

  revalidatePath(`/posts/${postSlug}`);
  return { ok: true };
}
