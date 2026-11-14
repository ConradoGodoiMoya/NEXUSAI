"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { api, ApiError } from "./api-client";

/** Envio de imagem com pré-visualização. O servidor valida, otimiza e converte para WebP. */
export function ImageUpload({
  label,
  value,
  onChange,
  kind = "product",
  help,
  aspect = "aspect-square",
}: {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
  kind?: "product" | "category" | "banner";
  help?: string;
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function upload(file: File) {
    setError(null);
    if (file.size > 8 * 1024 * 1024) return setError("Imagem muito grande (máximo de 8 MB).");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await api<{ url: string }>("/api/admin/uploads", { form });
      onChange(res.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Falha no envio da imagem.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="label">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
        className={`relative ${aspect} overflow-hidden rounded-2xl border-2 border-dashed transition ${drag ? "border-brand-500 bg-brand-50" : "border-graphite-200 bg-graphite-50"}`}
      >
        {value ? (
          <>
            <Image src={value} alt="Pré-visualização" fill sizes="400px" className="object-contain" unoptimized={!value.startsWith("/")} />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button type="button" onClick={() => input.current?.click()} className="btn btn-sm bg-white/95 text-navy-900 shadow-soft hover:bg-white" disabled={busy}>
                <Upload className="h-4 w-4" /> Trocar
              </button>
              <button type="button" onClick={() => onChange("")} className="btn btn-sm bg-white/95 text-red-600 shadow-soft hover:bg-white" aria-label="Remover imagem" disabled={busy}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-graphite-500 hover:text-navy-800" disabled={busy}>
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-semibold">Clique ou arraste uma imagem</span>
            <span className="text-xs">JPG, PNG, WebP ou AVIF · até 8 MB</span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-7 w-7 animate-spin text-navy-700" aria-label="Enviando" />
          </div>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      {error ? <p className="field-error">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}
