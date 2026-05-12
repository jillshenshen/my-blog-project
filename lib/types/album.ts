export type AlbumImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
  takenAt: string | null;
  sortOrder: number;
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  published: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
};

export type AlbumWithImages = Album & {
  images: AlbumImage[];
};
