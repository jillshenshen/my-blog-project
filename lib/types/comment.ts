// 前台公開使用的 comment 形狀（不含 email）
export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorAvatar: string | null;
  verified: boolean;
  content: string;
  createdAt: string;
};

// 後台用的形狀（多出 email + 是否登入身分）
export type AdminComment = Comment & {
  authorEmail: string;
  userId: string | null;
  postSlug: string;
  postTitle: string;
};

// 將 root + 一層 replies 攤平成樹狀結構供前台渲染
export type CommentThread = Comment & {
  replies: Comment[];
};
