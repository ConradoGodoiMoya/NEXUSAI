"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { AdminUser } from "@/lib/types";
import { api, ApiError } from "./api-client";
import { SelectField, TextField, Toggle } from "./fields";
import { ConfirmDialog, Modal } from "./modal";
import { useToast } from "./toast";

type Form = { name: string; email: string; role: "admin" | "editor"; active: boolean; password: string };

export function UsersManager({ initial, meId }: { initial: AdminUser[]; meId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);
  const [form, setForm] = useState<Form>({ name: "", email: "", role: "editor", active: true, password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);

  function open(u: AdminUser | "new") {
    setErrors({});
    setEditing(u);
    setForm(u === "new" ? { name: "", email: "", role: "editor", active: true, password: "" } : { name: u.name, email: u.email, role: u.role, active: u.active, password: "" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing === "new") await api("/api/admin/users", { body: form });
      else if (editing) await api(`/api/admin/users/${editing.id}`, { method: "PUT", body: form });
      toast("success", "Usuário salvo.");
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
      await api(`/api/admin/users/${toDelete.id}`, { method: "DELETE" });
      toast("success", "Usuário excluído.");
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
        <button className="btn btn-primary" onClick={() => open("new")}><Plus className="h-4 w-4" /> Novo usuário</button>
      </div>
      <div className="card overflow-hidden">
        <ul className="divide-y divide-graphite-100">
          {initial.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 font-bold text-navy-800">{u.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">{u.name} {u.id === meId && <span className="text-xs font-medium text-graphite-500">(você)</span>}</p>
                <p className="truncate text-sm text-graphite-500">{u.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.role === "admin" ? "bg-navy-900 text-white" : "bg-graphite-100 text-graphite-700"}`}>{u.role === "admin" ? "Administrador" : "Editor"}</span>
              {!u.active && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Desativado</span>}
              <span className="hidden text-xs text-graphite-400 md:block">{u.lastLoginAt ? `Último acesso ${formatDate(u.lastLoginAt)}` : "Nunca acessou"}</span>
              <div className="flex gap-1">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100" onClick={() => open(u)} aria-label={`Editar ${u.name}`}><Pencil className="h-4 w-4" /></button>
                {u.id !== meId && (
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg text-graphite-500 hover:bg-red-50 hover:text-red-600" onClick={() => setToDelete(u)} aria-label={`Excluir ${u.name}`}><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-graphite-600 ring-1 ring-graphite-100">
        <strong className="text-navy-900">Administrador:</strong> acesso completo, incluindo configurações e usuários. <strong className="text-navy-900">Editor:</strong> gerencia produtos, categorias e avaliações.
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Novo usuário" : "Editar usuário"}>
        <form onSubmit={save} className="space-y-5" noValidate>
          <TextField label="Nome" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
          <TextField label="E-mail" name="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required autoComplete="off" />
          <SelectField label="Perfil" name="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Form["role"] })}>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </SelectField>
          <TextField
            label={editing === "new" ? "Senha inicial" : "Nova senha (opcional)"}
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            help="Mínimo de 10 caracteres, com letras e números."
          />
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Acesso ativo" />
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</button>
        </form>
      </Modal>
      <ConfirmDialog open={!!toDelete} title="Excluir usuário" message={<>Excluir o acesso de <strong>{toDelete?.email}</strong>?</>} busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />
    </>
  );
}
