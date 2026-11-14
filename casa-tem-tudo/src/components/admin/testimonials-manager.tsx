"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { formatDate } from "@/lib/format";
import type { Testimonial } from "@/lib/types";
import { api, ApiError } from "./api-client";
import { SelectField, TextArea, TextField, Toggle } from "./fields";
import { ConfirmDialog, Modal } from "./modal";
import { useToast } from "./toast";

type Form = { authorName: string; rating: string; content: string; reviewDate: string; source: string; sortOrder: string; active: boolean };
const empty: Form = { authorName: "", rating: "5", content: "", reviewDate: "", source: "Google", sortOrder: "0", active: true };

export function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<Testimonial | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Testimonial | null>(null);

  function open(t: Testimonial | "new") {
    setErrors({});
    setEditing(t);
    setForm(t === "new" ? empty : { authorName: t.authorName, rating: String(t.rating), content: t.content, reviewDate: t.reviewDate ?? "", source: t.source, sortOrder: String(t.sortOrder), active: t.active });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const body = { ...form, rating: Number(form.rating), sortOrder: Number(form.sortOrder) || 0 };
    try {
      if (editing === "new") {
        const res = await api<{ testimonial: Testimonial }>("/api/admin/testimonials", { body });
        setItems((xs) => [res.testimonial, ...xs]);
      } else if (editing) {
        const res = await api<{ testimonial: Testimonial }>(`/api/admin/testimonials/${editing.id}`, { method: "PUT", body });
        setItems((xs) => xs.map((x) => (x.id === editing.id ? res.testimonial : x)));
      }
      toast("success", "Avaliação salva.");
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
      await api(`/api/admin/testimonials/${toDelete.id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== toDelete.id));
      toast("success", "Avaliação removida.");
      setToDelete(null);
    } catch (err) {
      toast("error", err instanceof ApiError ? err.message : "Falha ao excluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex gap-2"><AlertTriangle className="h-5 w-5 shrink-0" /> Publique apenas avaliações reais, copiadas do Google ou recebidas com autorização do cliente.</p>
        <button className="btn btn-primary shrink-0" onClick={() => open("new")}><Plus className="h-4 w-4" /> Adicionar avaliação</button>
      </div>
      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-semibold text-navy-900">Nenhuma avaliação publicada.</p>
          <p className="mt-1 text-sm text-graphite-600">Sem avaliações cadastradas, o site exibe a nota e o total do Google com um link para lê-las.</p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((t) => (
            <li key={t.id} className={`card flex flex-col p-5 ${t.active ? "" : "opacity-60"}`}>
              <div className="flex items-center justify-between">
                <Stars value={t.rating} />
                {!t.active && <span className="rounded-full bg-graphite-200 px-2 py-0.5 text-xs font-semibold">Oculta</span>}
              </div>
              <p className="mt-3 line-clamp-4 flex-1 text-sm text-graphite-700">“{t.content}”</p>
              <p className="mt-4 text-sm font-semibold text-navy-900">{t.authorName}</p>
              <p className="text-xs text-graphite-500">{t.source}{t.reviewDate && ` · ${formatDate(t.reviewDate)}`}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn btn-outline btn-sm flex-1" onClick={() => open(t)}><Pencil className="h-4 w-4" /> Editar</button>
                <button className="btn btn-sm text-red-600 hover:bg-red-50" onClick={() => setToDelete(t)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Nova avaliação" : "Editar avaliação"}>
        <form onSubmit={save} className="space-y-5" noValidate>
          <TextField label="Nome do cliente (como aparece no Google)" name="authorName" required value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} error={errors.authorName} />
          <div className="grid gap-5 sm:grid-cols-3">
            <SelectField label="Nota" name="rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
            </SelectField>
            <TextField label="Data" name="reviewDate" type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} error={errors.reviewDate} />
            <TextField label="Origem" name="source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} error={errors.source} />
          </div>
          <TextArea label="Texto da avaliação" name="content" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} error={errors.content} maxLength={1200} rows={5} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Ordem" name="sortOrder" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </div>
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Exibir no site" />
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} title="Excluir avaliação" message={<>Remover a avaliação de <strong>{toDelete?.authorName}</strong>?</>} busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
