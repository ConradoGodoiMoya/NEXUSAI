"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { api, ApiError } from "./api-client";
import { SelectField, TextArea, TextField, Toggle } from "./fields";
import { ImageUpload } from "./image-upload";
import { useToast } from "./toast";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    categoryId: product?.categoryId ? String(product.categoryId) : "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    details: product?.details ?? "",
    brand: product?.brand ?? "",
    unit: product?.unit ?? "",
    price: product?.price !== null && product?.price !== undefined ? product.price.toFixed(2).replace(".", ",") : "",
    imageUrl: product?.imageUrl ?? "",
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    sortOrder: String(product?.sortOrder ?? 0),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const priceText = f.price.trim().replace(/\./g, "").replace(",", ".");
    if (priceText && Number.isNaN(Number(priceText))) {
      setErrors({ price: "Use um valor como 29,90" });
      setBusy(false);
      return;
    }
    const body = {
      ...f,
      categoryId: f.categoryId ? Number(f.categoryId) : null,
      price: priceText === "" ? null : Number(priceText),
      sortOrder: Number(f.sortOrder) || 0,
    };
    try {
      if (product) {
        await api(`/api/admin/products/${product.id}`, { method: "PUT", body });
        toast("success", "Produto atualizado.");
        router.refresh();
      } else {
        await api("/api/admin/products", { body });
        toast("success", "Produto cadastrado.");
        router.push("/admin/produtos");
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        toast("error", err.message);
      } else toast("error", "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]" noValidate>
      <div className="space-y-6">
        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-bold">Informações principais</h2>
          <TextField label="Nome do produto" name="name" required value={f.name} onChange={(e) => set("name", e.target.value)} error={errors.name} maxLength={160} />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Categoria" name="categoryId" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{!c.active ? " (inativa)" : ""}</option>
              ))}
            </SelectField>
            <TextField label="Marca" name="brand" value={f.brand} onChange={(e) => set("brand", e.target.value)} error={errors.brand} maxLength={120} help="Opcional. Exibida somente se preenchida." />
          </div>
          <TextField label="Resumo" name="shortDescription" value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} error={errors.shortDescription} maxLength={300} help="Uma frase curta exibida no card do catálogo." />
          <TextArea label="Descrição completa" name="description" value={f.description} onChange={(e) => set("description", e.target.value)} error={errors.description} maxLength={5000} rows={6} help="Deixe uma linha em branco para separar parágrafos." />
          <TextArea
            label="Informações adicionais"
            name="details"
            value={f.details}
            onChange={(e) => set("details", e.target.value)}
            error={errors.details}
            maxLength={3000}
            rows={4}
            placeholder={"Uma informação por linha, no formato Nome: valor\nEx.: Embalagem: saco de 50 kg"}
            help="Cada linha vira uma linha da tabela de especificações."
          />
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-bold">Preço</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Preço (R$)" name="price" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} error={errors.price} placeholder="Deixe vazio para “Consulte o preço”" />
            <TextField label="Unidade" name="unit" value={f.unit} onChange={(e) => set("unit", e.target.value)} error={errors.unit} maxLength={40} placeholder="Ex.: unidade, m², saco" />
          </div>
          <p className="text-xs text-graphite-500">Sem preço, o site mostra “Consulte o preço” e o botão de consulta pelo WhatsApp.</p>
        </section>
      </div>

      <div className="space-y-6">
        <section className="card space-y-5 p-6">
          <ImageUpload label="Foto do produto" value={f.imageUrl || null} onChange={(url) => set("imageUrl", url)} help="Fundo claro e produto centralizado ficam melhores." />
          {errors.imageUrl && <p className="field-error">{errors.imageUrl}</p>}
        </section>
        <section className="card space-y-3 p-6">
          <h2 className="text-lg font-bold">Exibição</h2>
          <Toggle checked={f.active} onChange={(v) => set("active", v)} label="Visível no site" description="Desative para ocultar sem excluir." />
          <Toggle checked={f.featured} onChange={(v) => set("featured", v)} label="Produto em destaque" description="Aparece na página inicial e no topo do catálogo." />
          <TextField label="Ordem de exibição" name="sortOrder" type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} help="Menor número aparece primeiro." className="pt-2" />
          <TextField label="Endereço (URL)" name="slug" value={f.slug} onChange={(e) => set("slug", e.target.value)} error={errors.slug} help="Gerado automaticamente a partir do nome." />
        </section>
        <div className="sticky bottom-4 flex flex-col gap-2">
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {product ? "Salvar alterações" : "Cadastrar produto"}
          </button>
          {product?.active && (
            <a href={`/produtos/${product.slug}`} target="_blank" rel="noopener" className="btn btn-outline w-full">
              <ExternalLink className="h-4 w-4" /> Ver no site
            </a>
          )}
          <Link href="/admin/produtos" className="btn w-full text-graphite-600 hover:bg-graphite-100">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </div>
    </form>
  );
}
