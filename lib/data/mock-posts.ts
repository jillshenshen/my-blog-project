import type { Category } from "@/lib/types/category";
import type { Post } from "@/lib/types/post";
import type { Tag } from "@/lib/types/tag";

export const mockCategories: Category[] = [
  { id: "c1", name: "Lifestyle", slug: "lifestyle" },
  { id: "c2", name: "Travel", slug: "travel" },
  { id: "c3", name: "Beauty", slug: "beauty" },
  { id: "c4", name: "Food", slug: "food" },
  { id: "c5", name: "Tech", slug: "tech" },
];

export const mockTags: Tag[] = [
  { id: "t1", name: "nextjs", slug: "nextjs" },
  { id: "t2", name: "typescript", slug: "typescript" },
  { id: "t3", name: "css", slug: "css" },
  { id: "t4", name: "supabase", slug: "supabase" },
  { id: "t5", name: "design", slug: "design" },
  { id: "t6", name: "tutorial", slug: "tutorial" },
  { id: "t7", name: "thoughts", slug: "thoughts" },
  { id: "t8", name: "review", slug: "review" },
];

const cat = (slug: string) => mockCategories.find((c) => c.slug === slug)!;
const tag = (slug: string) => mockTags.find((t) => t.slug === slug)!;

export const mockPosts: Post[] = [
  {
    id: "p1",
    title: "A Lovely Night",
    slug: "a-lovely-night",
    excerpt:
      "用一篇 Markdown 範例文章驗證標題、程式碼區塊、清單與表格的渲染效果。",
    content: `這是一篇用來示範 **Markdown 渲染** 與 *語法高亮* 的文章。

## 為什麼選擇 Next.js

- App Router 原生支援 Server Components
- 內建 Image / Font 優化
- Vercel 部署一鍵搞定

## 程式碼範例

\`\`\`tsx
type Props = { title: string };

export function Hello({ title }: Props) {
  return <h1>{title}</h1>;
}
\`\`\`

\`\`\`bash
npm run dev
\`\`\`

## 清單與表格

| 項目 | 狀態 |
| --- | --- |
| 文章列表 | ✅ |
| Markdown 渲染 | ✅ |
| 主題切換 | ✅ |

> 引用區塊也支援樣式。`,
    coverImage:
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1200&q=80",
    published: true,
    publishedAt: "2025-03-04T00:00:00.000Z",
    createdAt: "2025-03-04T00:00:00.000Z",
    updatedAt: "2025-03-04T00:00:00.000Z",
    category: cat("tech"),
    tags: [tag("nextjs"), tag("typescript"), tag("tutorial")],
  },
  {
    id: "p2",
    title: "Someone In The Crowd",
    slug: "someone-in-the-crowd",
    excerpt:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    coverImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    published: true,
    publishedAt: "2024-11-12T00:00:00.000Z",
    createdAt: "2024-11-12T00:00:00.000Z",
    updatedAt: "2024-11-12T00:00:00.000Z",
    category: cat("lifestyle"),
    tags: [tag("thoughts")],
  },
  {
    id: "p3",
    title: "Right Path Mystery",
    slug: "right-path-mystery",
    excerpt:
      "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.",
    content: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio.",
    coverImage:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
    published: true,
    publishedAt: "2024-06-21T00:00:00.000Z",
    createdAt: "2024-06-21T00:00:00.000Z",
    updatedAt: "2024-06-21T00:00:00.000Z",
    category: cat("travel"),
    tags: [tag("thoughts"), tag("review")],
  },
  {
    id: "p4",
    title: "My Style Statement",
    slug: "my-style-statement",
    excerpt:
      "Aenean nec lorem. In porttitor. Donec laoreet nonummy augue. Suspendisse dui purus, scelerisque at, vulputate vitae, pretium mattis.",
    content: "Aenean nec lorem. In porttitor.",
    coverImage:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80",
    published: true,
    publishedAt: "2024-02-15T00:00:00.000Z",
    createdAt: "2024-02-15T00:00:00.000Z",
    updatedAt: "2024-02-15T00:00:00.000Z",
    category: cat("beauty"),
    tags: [tag("design"), tag("review")],
  },
  {
    id: "p5",
    title: "Ways to Remember",
    slug: "ways-to-remember",
    excerpt:
      "Nullam tincidunt adipiscing enim. Phasellus tempus. Proin viverra, ligula sit amet ultrices semper.",
    content: "Nullam tincidunt adipiscing enim.",
    coverImage:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1200&q=80",
    published: true,
    publishedAt: "2023-09-08T00:00:00.000Z",
    createdAt: "2023-09-08T00:00:00.000Z",
    updatedAt: "2023-09-08T00:00:00.000Z",
    category: cat("food"),
    tags: [tag("thoughts")],
  },
  {
    id: "p6",
    title: "Crafting CSS Variables",
    slug: "crafting-css-variables",
    excerpt:
      "用 CSS Custom Properties 建立可主題化的設計系統，讓深淺切換與主題微調更簡單。",
    content: "本文介紹如何用 CSS Variables 設計可主題化的網站。",
    coverImage:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&q=80",
    published: true,
    publishedAt: "2023-02-20T00:00:00.000Z",
    createdAt: "2023-02-20T00:00:00.000Z",
    updatedAt: "2023-02-20T00:00:00.000Z",
    category: cat("tech"),
    tags: [tag("css"), tag("design"), tag("tutorial")],
  },
];

export function getAllPosts(): Post[] {
  return [...mockPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  return mockPosts.find((p) => p.slug === slug);
}

export function getPostsByTag(tagSlug: string): Post[] {
  return getAllPosts().filter((p) => p.tags.some((t) => t.slug === tagSlug));
}

export function getPostsByCategory(categorySlug: string): Post[] {
  return getAllPosts().filter((p) => p.category.slug === categorySlug);
}

export function getPostsByYearMonth(year: number, month: number): Post[] {
  return getAllPosts().filter((p) => {
    const d = new Date(p.publishedAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

export function getRecentPosts(limit = 5): Post[] {
  return getAllPosts().slice(0, limit);
}

export function getAllTags(): Tag[] {
  return mockTags;
}

export function getAllCategories(): Category[] {
  return mockCategories;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find((c) => c.slug === slug);
}

export function getTagBySlug(slug: string): Tag | undefined {
  return mockTags.find((t) => t.slug === slug);
}

export type ArchiveMonthEntry = { month: number; count: number };
export type ArchiveEntry = {
  year: number;
  count: number;
  months: ArchiveMonthEntry[];
};

export function getArchive(): ArchiveEntry[] {
  const yearMap = new Map<number, Map<number, number>>();
  for (const post of getAllPosts()) {
    const d = new Date(post.publishedAt);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const monthMap = yearMap.get(year)!;
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  return Array.from(yearMap.entries())
    .map(([year, monthMap]) => {
      const months = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => b.month - a.month);
      const count = months.reduce((sum, m) => sum + m.count, 0);
      return { year, count, months };
    })
    .sort((a, b) => b.year - a.year);
}

export function searchPosts(query: string): Post[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllPosts().filter((post) => {
    return (
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.content.toLowerCase().includes(q)
    );
  });
}
