"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";

const SORTS = [
  { value: "relevancia", label: "Relevância" },
  { value: "nome", label: "Nome (A–Z)" },
  { value: "recentes", label: "Mais recentes" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
];

/** Busca com atualização da URL (compartilhável e indexável) e ordenação. */
export function CatalogToolbar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(params.get("busca") ?? "");
  const first = useRef(true);

  useEffect(() => setTerm(params.get("busca") ?? ""), [params]);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("pagina");
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const current = params.get("busca") ?? "";
    if (term.trim() === current) return;
    const t = setTimeout(() => update({ busca: term.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          update({ busca: term.trim() || null });
        }}
      >
        <label htmlFor="busca" className="sr-only">
          Buscar produtos
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-graphite-400" aria-hidden="true" />
        <input
          id="busca"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar produtos, marcas…"
          className="input h-12 rounded-full pl-12 pr-12 text-base"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={80}
        />
        {pending ? (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-graphite-400" aria-label="Carregando" />
        ) : (
          term && (
            <button type="button" onClick={() => setTerm("")} className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700" aria-label="Limpar busca">
              <X className="h-4 w-4" />
            </button>
          )
        )}
      </form>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-sm text-graphite-500 sm:hidden" aria-live="polite">
          {total} {total === 1 ? "produto" : "produtos"}
        </p>
        <label className="flex items-center gap-2 text-sm text-graphite-600">
          <span className="whitespace-nowrap">Ordenar por</span>
          <select
            value={params.get("ordem") ?? "relevancia"}
            onChange={(e) => update({ ordem: e.target.value === "relevancia" ? null : e.target.value })}
            className="input h-12 w-auto cursor-pointer rounded-full py-0 pr-9 font-medium"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
