"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "./api-client";
import { TextField } from "./fields";
import { useToast } from "./toast";

export function PasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="card max-w-lg space-y-5 p-6"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (newPassword !== confirm) return setErrors({ confirm: "As senhas não conferem." });
        setBusy(true);
        setErrors({});
        try {
          await api("/api/admin/me/password", { method: "PUT", body: { currentPassword, newPassword } });
          toast("success", "Senha alterada. Outras sessões abertas foram encerradas.");
          setCurrent("");
          setNew("");
          setConfirm("");
        } catch (err) {
          if (err instanceof ApiError) {
            setErrors(err.fields ?? {});
            toast("error", err.message);
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-lg font-bold">Alterar senha</h2>
      <TextField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} />
      <TextField label="Nova senha" name="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} error={errors.newPassword} help="Mínimo de 10 caracteres, com letras e números." />
      <TextField label="Confirme a nova senha" name="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
      <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar nova senha</button>
    </form>
  );
}
