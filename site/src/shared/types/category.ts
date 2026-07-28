export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Shape mínima para nav / filtros */
export type CategoryNavItem = {
  id: string;
  slug: string;
  name: string;
  href: string;
};
