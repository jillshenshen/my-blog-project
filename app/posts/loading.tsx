import { PostGridCardSkeleton } from "@/components/blog/PostGridCardSkeleton";

const PLACEHOLDER_COUNT = 8;

export default function PostsLoading() {
  return (
    <div className="grid justify-center gap-x-2 gap-y-2 [grid-template-columns:repeat(auto-fill,250px)]">
      <header className="col-span-full mb-4 bg-[var(--color-border)] px-3 py-2 text-center sm:px-4">
        <h1 className="text-xs text-muted">Posts</h1>
      </header>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
        <PostGridCardSkeleton key={i} />
      ))}
    </div>
  );
}
