import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/sidebar";
import { listCategories } from "@/lib/data/categories";
import { getProductById } from "@/lib/data/products";

export const metadata = { title: "Editar produto" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [product, categories] = await Promise.all([getProductById(id), listCategories({ includeInactive: true })]);
  if (!product) notFound();
  return (
    <>
      <PageTitle title="Editar produto" description={product.name} />
      <ProductForm key={product.updatedAt} product={product} categories={categories} />
    </>
  );
}
