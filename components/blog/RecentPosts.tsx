import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types/post";
import { formatDate } from "@/lib/utils/format";

type Props = {
  posts: Post[];
};

export function RecentPosts({ posts }: Props) {
  return (
    <ul className="space-y-5">
      {posts.map((post) => (
        <li key={post.id} className="flex items-start gap-4">
          <Link
            href={`/posts/${post.slug}`}
            className="relative block h-16 w-16 flex-shrink-0 overflow-hidden bg-[var(--color-border)]"
          >
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/posts/${post.slug}`}
              className="block truncate text-sm text-foreground hover:text-muted"
            >
              {post.title}
            </Link>
            <p className="mt-1 text-[10px] tracking-[0.25em] text-subtle uppercase">
              {formatDate(post.publishedAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
