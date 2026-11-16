import { CategoriesManager } from "@/components/admin/categories-manager";
import { PageTitle } from "@/components/admin/sidebar";
import { listCategories } from "@/lib/data/categories";

export const metadata = { title: "Categorias" };

export default async function AdminCategories() {
  const items = await listCategories({ includeInactive: true });
  return (
    <>
      <PageTitle title="Categorias" description="As categorias iniciais são sugestões de organização — revise, edite ou exclua conforme o que a loja realmente trabalha." />
      <CategoriesManager initial={items} />
    </>
  );
}
