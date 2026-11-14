import Link from "next/link";
import { AlertTriangle, ArrowRight, ImageOff, Package, Plus, Sparkles, Tag, Tags } from "lucide-react";
import { PageTitle } from "@/components/admin/sidebar";
import { ProductImage } from "@/components/site/product-image";
import { requirePageUser } from "@/lib/auth";
import { recentActivity } from "@/lib/data/activity";
import { listCategories } from "@/lib/data/categories";
import { listProducts, productStats } from "@/lib/data/products";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Visão geral" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await requirePageUser();
  const { erro } = await searchParams;
  const [stats, categories, recent, activity] = await Promise.all([
    productStats(),
    listCategories({ includeInactive: true }),
    listProducts({ includeInactive: true, sort: "recentes", limit: 6 }),
    recentActivity(8),
  ]);
  const activeCats = categories.filter((c) => c.active).length;
  const maxCount = Math.max(1, ...categories.map((c) => c.productCount ?? 0));

  return (
    <>
      {erro === "permissao" && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          <AlertTriangle className="h-4 w-4" /> Essa área é exclusiva para administradores.
        </p>
      )}
      <PageTitle
        title={`Olá, ${user.name.split(" ")[0]}!`}
        description="Acompanhe o catálogo e mantenha o site sempre atualizado."
        action={
          <Link href="/admin/produtos/novo" className="btn btn-primary">
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        }
      />

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Produtos cadastrados", value: stats.total, sub: `${stats.active} visíveis no site`, icon: Package },
          { label: "Categorias", value: categories.length, sub: `${activeCats} ativas`, icon: Tags },
          { label: "Em destaque", value: stats.featured, sub: "aparecem na página inicial", icon: Sparkles },
          { label: "Com preço", value: stats.withPrice, sub: `${stats.total - stats.withPrice} como “Consulte”`, icon: Tag },
        ].map((k) => (
          <li key={k.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-graphite-500">{k.label}</p>
              <k.icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-navy-900">{k.value}</p>
            <p className="mt-1 text-xs text-graphite-500">{k.sub}</p>
          </li>
        ))}
      </ul>

      {(stats.total - stats.withImage > 0 || stats.uncategorized > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {stats.total - stats.withImage > 0 && (
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <ImageOff className="h-4 w-4" /> {stats.total - stats.withImage} produto(s) sem foto
            </p>
          )}
          {stats.uncategorized > 0 && (
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <Tags className="h-4 w-4" /> {stats.uncategorized} produto(s) sem categoria
            </p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-6" aria-labelledby="recentes">
          <div className="flex items-center justify-between">
            <h2 id="recentes" className="text-lg font-bold">Adicionados recentemente</h2>
            <Link href="/admin/produtos" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Ver todos</Link>
          </div>
          {recent.items.length > 0 ? (
            <ul className="mt-4 divide-y divide-graphite-100">
              {recent.items.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-4 py-3 hover:bg-graphite-50/60">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-graphite-100 bg-white">
                      <ProductImage src={p.imageUrl} alt={p.name} sizes="48px" pad="p-1" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-navy-900">{p.name}</span>
                      <span className="block text-xs text-graphite-500">{p.categoryName ?? "Sem categoria"} · {formatDate(p.createdAt)}</span>
                    </span>
                    <span className="hidden text-sm font-semibold text-graphite-700 sm:block">{formatPrice(p.price) ?? "Consulte"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-graphite-200 p-8 text-center">
              <p className="font-semibold text-navy-900">Nenhum produto cadastrado ainda.</p>
              <p className="mt-1 text-sm text-graphite-600">Comece cadastrando os itens que você quer mostrar no site.</p>
              <Link href="/admin/produtos/novo" className="btn btn-primary btn-sm mt-4"><Plus className="h-4 w-4" /> Cadastrar produto</Link>
            </div>
          )}
        </section>

        <section className="card p-6" aria-labelledby="catalogo">
          <div className="flex items-center justify-between">
            <h2 id="catalogo" className="text-lg font-bold">Catálogo por categoria</h2>
            <Link href="/admin/categorias" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Gerenciar</Link>
          </div>
          <ul className="mt-5 space-y-3.5">
            {categories.map((c) => (
              <li key={c.id}>
                <div className="flex justify-between text-sm">
                  <span className={c.active ? "font-medium text-graphite-800" : "text-graphite-400 line-through"}>{c.name}</span>
                  <span className="tabular-nums text-graphite-500">{c.productCount ?? 0}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-graphite-100">
                  <div className="h-full rounded-full bg-navy-700" style={{ width: `${((c.productCount ?? 0) / maxCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 p-6" aria-labelledby="atividade">
        <h2 id="atividade" className="text-lg font-bold">Atividade recente</h2>
        {activity.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                <span className="flex-1 text-graphite-700">
                  <strong className="font-semibold text-navy-900">{a.user_name ?? "Usuário removido"}</strong> — {a.summary}
                </span>
                <time className="shrink-0 text-xs text-graphite-400" dateTime={a.created_at}>{formatDate(a.created_at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-graphite-500">As alterações feitas no painel aparecerão aqui.</p>
        )}
        <Link href="/" target="_blank" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:text-brand-600">
          Ver o site publicado <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
