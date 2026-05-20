import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/types/post";
import { SectionHeading } from "@/components/ui/SectionHeading";

type Props = {
  posts: Post[];
};

function formatYmd(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function RelatedPosts({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeading>You Might Also Like</SectionHeading>
      <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <article className="group">
              <Link
                href={`/posts/${post.slug}`}
                className="relative block aspect-[3/2] w-full overflow-hidden bg-[var(--color-border)]"
              >
                {post.coverImage ? (
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] tracking-[0.3em] text-muted uppercase">
                    No Cover
                  </div>
                )}
              </Link>
              <div className="mt-4 px-1">
                <Link
                  href={`/categories/${post.category.slug}`}
                  className="text-[10px] tracking-[0.3em] text-accent uppercase transition hover:opacity-70"
                >
                  {post.category.name}
                </Link>
                <h3 className="mt-2 font-serif text-sm font-bold leading-snug text-foreground sm:text-base">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="transition group-hover:text-muted"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 text-[10px] tracking-[0.3em] text-muted uppercase">
                  {formatYmd(post.publishedAt)}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
