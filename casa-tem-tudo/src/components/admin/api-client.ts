"use client";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

/** fetch com JSON, mesma origem e tratamento padronizado de erros da API. */
export async function api<T = unknown>(url: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(url, {
    method: init.method ?? (init.body || init.form ? "POST" : "GET"),
    headers: init.form ? undefined : { "Content-Type": "application/json" },
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.includes("/api/auth/login")) {
    window.location.href = "/admin/login";
  }
  if (!res.ok) throw new ApiError(data.error ?? "Não foi possível concluir a ação.", res.status, data.fields);
  return data as T;
}
