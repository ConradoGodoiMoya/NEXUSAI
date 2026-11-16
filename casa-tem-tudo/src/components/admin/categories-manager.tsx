"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { CATEGORY_ICON_LABELS, CATEGORY_ICONS } from "@/lib/category-icons";
import type { Category } from "@/lib/types";
import { api, ApiError } from "./api-client";
import { TextArea, TextField, Toggle } from "./fields";
import { ImageUpload } from "./image-upload";
import { ConfirmDialog, Modal } from "./modal";
import { useToast } from "./toast";

type Form = { name: string; slug: string; description: string; icon: string; imageUrl: string; sortOrder: string; active: boolean };
const empty: Form = { name: "", slug: "", description: "", icon: "boxes", imageUrl: "", sortOrder: "0", active: true };

export function CategoriesManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  function open(c: Category | "new") {
    setErrors({});
    setEditing(c);
    setForm(
      c === "new"
        ? { ...empty, sortOrder: String((items.at(-1)?.sortOrder ?? 0) + 10) }
        : { name: c.name, slug: c.slug, description: c.description, icon: c.icon, imageUrl: c.imageUrl ?? "", sortOrder: String(c.sortOrder), active: c.active },
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = { ...form, sortOrder: Number(form.sortOrder) || 0 };
    try {
      if (editing === "new") {
        const res = await api<{ category: Category }>("/api/admin/categories", { body });
        setItems((xs) => [...xs, res.category].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
        toast("success", "Categoria criada.");
      } else if (editing) {
        const res = await api<{ category: Category }>(`/api/admin/categories/${editing.id}`, { method: "PUT", body });
        setItems((xs) => xs.map((x) => (x.id === editing.id ? res.category : x)).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
        toast("success", "Categoria atualizada.");
      }
      setEditing(null);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fields ?? {});
        toast("error", err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api(`/api/admin/categories/${toDelete.id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== toDelete.id));
      toast("success", "Categoria excluída.");
      setToDelete(null);
      router.refresh();
    } catch (err) {
      toast("error", err instanceof ApiError ? err.message : "Falha ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button className="btn btn-primary" onClick={() => open("new")}><Plus className="h-4 w-4" /> Nova categoria</button>
      </div>
      {items.length === 0 ? (
        <div className="card p-12 text-center text-graphite-600">Nenhuma categoria cadastrada.</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <li key={c.id} className={`card flex flex-col overflow-hidden ${c.active ? "" : "opacity-60"}`}>
              <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-navy-50 to-white">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt="" fill sizes="400px" className="object-cover" />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-navy-800 shadow-soft">
                    <CategoryIcon name={c.icon} className="h-8 w-8" />
                  </span>
                )}
                {!c.active && <span className="absolute left-3 top-3 rounded-full bg-graphite-800 px-2.5 py-1 text-xs font-semibold text-white">Inativa</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold">{c.name}</h3>
                  <span className="shrink-0 rounded-full bg-graphite-100 px-2.5 py-0.5 text-xs font-semibold text-graphite-600">{c.productCount ?? 0} produto(s)</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-graphite-600">{c.description || "Sem descrição."}</p>
                <div className="mt-auto flex gap-2 pt-4">
                  <button className="btn btn-outline btn-sm flex-1" onClick={() => open(c)}><Pencil className="h-4 w-4" /> Editar</button>
                  <button className="btn btn-sm text-red-600 hover:bg-red-50" onClick={() => setToDelete(c)} aria-label={`Excluir ${c.name}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nova categoria" : "Editar categoria"} wide>
        <form onSubmit={save} className="grid gap-6 sm:grid-cols-[1fr_220px]" noValidate>
          <div className="space-y-5">
            <TextField label="Nome" name="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} maxLength={120} />
            <TextArea label="Descrição curta" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} maxLength={500} rows={3} />
            <fieldset>
              <legend className="label">Ícone (usado quando não há imagem)</legend>
              <div className="grid grid-cols-8 gap-2">
                {CATEGORY_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm({ ...form, icon: ic })}
                    aria-pressed={form.icon === ic}
                    title={CATEGORY_ICON_LABELS[ic]}
                    aria-label={CATEGORY_ICON_LABELS[ic]}
                    className={`flex aspect-square items-center justify-center rounded-xl border transition ${form.icon === ic ? "border-brand-500 bg-brand-50 text-brand-700" : "border-graphite-200 text-graphite-600 hover:border-graphite-300"}`}
                  >
                    <CategoryIcon name={ic} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Ordem" name="sortOrder" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} help="Menor aparece primeiro." />
              <TextField label="Endereço (URL)" name="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} help="Automático se vazio." />
            </div>
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Categoria ativa" description="Categorias inativas e seus produtos não aparecem no site." />
          </div>
          <div className="space-y-4">
            <ImageUpload label="Imagem" kind="category" aspect="aspect-[4/3]" value={form.imageUrl || null} onChange={(url) => setForm({ ...form, imageUrl: url })} help="Opcional." />
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir categoria"
        message={<>Excluir <strong>{toDelete?.name}</strong>? Os {toDelete?.productCount ?? 0} produto(s) dela continuarão cadastrados, mas ficarão sem categoria.</>}
        busy={busy}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
