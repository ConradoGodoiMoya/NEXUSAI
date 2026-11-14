"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Eye, EyeOff, Pencil, Search, Sparkles, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/site/product-image";
import { formatPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { api, ApiError } from "./api-client";
import { ConfirmDialog } from "./modal";
import { useToast } from "./toast";

export function ProductsTable({ initial, categories }: { initial: Product[]; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return items.filter((p) => {
      if (cat === "none" ? p.categoryId !== null : cat && String(p.categoryId) !== cat) return false;
      if (status === "visible" && !p.active) return false;
      if (status === "hidden" && p.active) return false;
      if (status === "featured" && !p.featured) return false;
      if (!term) return true;
      const hay = `${p.name} ${p.brand ?? ""} ${p.categoryName ?? ""}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      return hay.includes(term);
    });
  }, [items, q, cat, status]);

  async function patch(p: Product, flags: { featured?: boolean; active?: boolean }) {
    try {
      const res = await api<{ product: Product }>(`/api/admin/products/${p.id}`, { method: "PATCH", body: flags });
      setItems((xs) => xs.map((x) => (x.id === p.id ? res.product : x)));
      toast("success", flags.featured !== undefined ? (flags.featured ? "Produto destacado." : "Destaque removido.") : flags.active ? "Produto visível no site." : "Produto ocultado do site.");
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Falha ao atualizar.");
    }
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api(`/api/admin/products/${toDelete.id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== toDelete.id));
      toast("success", "Produto excluído.");
      setToDelete(null);
      router.refresh();
    } catch (e) {
      toast("error", e instanceof ApiError ? e.message : "Falha ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_200px_180px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca…" className="input pl-10" aria-label="Buscar produtos" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input" aria-label="Filtrar por categoria">
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          <option value="none">Sem categoria</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" aria-label="Filtrar por situação">
          <option value="">Todas as situações</option>
          <option value="visible">Visíveis</option>
          <option value="hidden">Ocultos</option>
          <option value="featured">Em destaque</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-navy-900">{items.length === 0 ? "Nenhum produto cadastrado." : "Nenhum produto corresponde aos filtros."}</p>
            {items.length === 0 && <Link href="/admin/produtos/novo" className="btn btn-primary btn-sm mt-4">Cadastrar o primeiro produto</Link>}
          </div>
        ) : (
          <ul className="divide-y divide-graphite-100">
            {filtered.map((p) => (
              <li key={p.id} className={clsx("flex items-center gap-4 px-4 py-3 sm:px-5", !p.active && "bg-graphite-50/70")}>
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-graphite-100 bg-white">
                  <ProductImage src={p.imageUrl} alt={p.name} sizes="56px" pad="p-1" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/produtos/${p.id}`} className="block truncate font-semibold text-navy-900 hover:text-brand-600">{p.name}</Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-graphite-500">
                    <span>{p.categoryName ?? "Sem categoria"}</span>
                    {p.brand && <span>· {p.brand}</span>}
                    <span>· {formatPrice(p.price) ?? "Consulte o preço"}</span>
                    {!p.active && <span className="rounded-full bg-graphite-200 px-2 py-0.5 font-semibold text-graphite-700">Oculto</span>}
                    {p.featured && <span className="rounded-full bg-brand-100 px-2 py-0.5 font-semibold text-brand-800">Destaque</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn label={p.featured ? "Remover destaque" : "Destacar"} onClick={() => patch(p, { featured: !p.featured })} active={p.featured}>
                    <Sparkles className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label={p.active ? "Ocultar do site" : "Mostrar no site"} onClick={() => patch(p, { active: !p.active })}>
                    {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </IconBtn>
                  <Link href={`/admin/produtos/${p.id}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100 hover:text-navy-900" aria-label={`Editar ${p.name}`} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <IconBtn label="Excluir" danger onClick={() => setToDelete(p)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-sm text-graphite-500">{filtered.length} de {items.length} produto(s)</p>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir produto"
        message={<>Tem certeza de que deseja excluir <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita. Para apenas tirar do site, use “Ocultar”.</>}
        busy={busy}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function IconBtn({ label, onClick, children, danger, active }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-lg transition",
        danger ? "text-graphite-500 hover:bg-red-50 hover:text-red-600" : active ? "bg-brand-50 text-brand-600 hover:bg-brand-100" : "text-graphite-500 hover:bg-graphite-100 hover:text-navy-900",
      )}
    >
      {children}
    </button>
  );
}
