import type { Category } from "./category";
import type { Tag } from "./tag";

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  tags: Tag[];
};
