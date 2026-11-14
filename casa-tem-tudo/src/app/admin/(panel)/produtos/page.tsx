import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductsTable } from "@/components/admin/products-table";
import { PageTitle } from "@/components/admin/sidebar";
import { listCategories } from "@/lib/data/categories";
import { listProducts } from "@/lib/data/products";

export const metadata = { title: "Produtos" };

export default async function AdminProducts() {
  const [{ items }, categories] = await Promise.all([
    listProducts({ includeInactive: true, sort: "recentes", limit: 200 }),
    listCategories({ includeInactive: true }),
  ]);
  return (
    <>
      <PageTitle
        title="Produtos"
        description="Cadastre, edite, destaque ou oculte itens do catálogo."
        action={<Link href="/admin/produtos/novo" className="btn btn-primary"><Plus className="h-4 w-4" /> Novo produto</Link>}
      />
      <ProductsTable initial={items} categories={categories} />
    </>
  );
}
