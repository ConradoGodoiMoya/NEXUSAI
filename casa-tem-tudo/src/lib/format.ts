const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return brl.format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });
}

export function formatRating(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Mantém apenas dígitos — útil para links tel: e wa.me. */
export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

/** Link tel: com DDI do Brasil quando o número não o possui. */
export function telHref(phone: string): string {
  const d = digitsOnly(phone);
  return `tel:+${d.length <= 11 ? `55${d}` : d}`;
}
