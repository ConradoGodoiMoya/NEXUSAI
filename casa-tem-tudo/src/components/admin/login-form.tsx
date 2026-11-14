"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api, ApiError } from "./api-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api("/api/auth/login", { body: { email, password } });
          router.replace("/admin");
          router.refresh();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
          setBusy(false);
        }
      }}
    >
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" type="email" className="input h-12" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </div>
      <div>
        <label htmlFor="password" className="label">Senha</label>
        <div className="relative">
          <input id="password" type={show ? "text" : "password"} className="input h-12 pr-12" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-graphite-500 hover:bg-graphite-100" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <button type="submit" className="btn btn-navy btn-lg w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
      </button>
    </form>
  );
}
