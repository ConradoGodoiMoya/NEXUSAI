export type Role = "admin" | "editor";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  productCount?: number;
}

export interface Product {
  id: number;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  details: string | null;
  brand: string | null;
  unit: string | null;
  price: number | null;
  imageUrl: string | null;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: number;
  authorName: string;
  rating: number;
  content: string;
  reviewDate: string | null;
  source: string;
  active: boolean;
  sortOrder: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export type ProductSort = "relevancia" | "nome" | "recentes" | "menor-preco" | "maior-preco";
