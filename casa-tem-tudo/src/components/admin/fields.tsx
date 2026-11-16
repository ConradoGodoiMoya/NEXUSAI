"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

interface Base {
  label: string;
  error?: string;
  help?: ReactNode;
  className?: string;
}

export function TextField({ label, error, help, className, id, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const fid = id ?? rest.name ?? label;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">{label}{rest.required && <span className="text-brand-600"> *</span>}</label>
      <input id={fid} {...rest} className={clsx("input", error && "border-red-400 focus:ring-red-100")} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : undefined} />
      {error ? <p id={`${fid}-err`} className="field-error">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}

export function TextArea({ label, error, help, className, id, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fid = id ?? rest.name ?? label;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">{label}{rest.required && <span className="text-brand-600"> *</span>}</label>
      <textarea id={fid} {...rest} className={clsx("input min-h-[110px] resize-y", error && "border-red-400")} aria-invalid={!!error} />
      {error ? <p className="field-error">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}

export function SelectField({ label, error, help, className, id, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const fid = id ?? rest.name ?? label;
  return (
    <div className={className}>
      <label htmlFor={fid} className="label">{label}</label>
      <select id={fid} {...rest} className={clsx("input", error && "border-red-400")}>
        {children}
      </select>
      {error ? <p className="field-error">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-graphite-200 p-4 transition hover:border-graphite-300">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx("relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand-600" : "bg-graphite-300")}
      >
        <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
      </button>
      <span>
        <span className="block text-sm font-semibold text-graphite-900">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-graphite-500">{description}</span>}
      </span>
    </label>
  );
}
