import { ProductForm } from "@/components/admin/product-form";
import { PageTitle } from "@/components/admin/sidebar";
import { listCategories } from "@/lib/data/categories";

export const metadata = { title: "Novo produto" };

export default async function NewProduct() {
  const categories = await listCategories({ includeInactive: true });
  return (
    <>
      <PageTitle title="Novo produto" description="Preencha apenas o que tiver confirmado — campos vazios não aparecem no site." />
      <ProductForm categories={categories} />
    </>
  );
}
