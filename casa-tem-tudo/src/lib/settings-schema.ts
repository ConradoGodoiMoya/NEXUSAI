import { z } from "zod";

/* Campos de URL aceitam vazio (= não exibir), caminhos internos (/media/...) ou http(s). */
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Informe uma URL válida (https://...)")
  .refine((v) => !v.startsWith("//"), "URL inválida");

/* Imagens: somente arquivos enviados pelo painel (otimizados e servidos pelo próprio site). */
const mediaUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\/media\/[a-f0-9]{24}\.webp$/.test(v), "Envie a imagem pelo botão de upload");

const text = (max: number) => z.string().trim().max(max);
const required = (max: number, label: string) => z.string().trim().min(1, `${label} é obrigatório`).max(max);

export const hourSchema = z.object({
  days: required(60, "Dias"),
  time: required(60, "Horário"),
});

export const highlightSchema = z.object({
  title: required(60, "Título"),
  text: text(220),
  image: mediaUrl,
});

export const siteSettingsSchema = z.object({
  company: z.object({
    name: required(120, "Nome"),
    shortName: required(60, "Nome curto"),
    slogan: text(160),
    phone: required(30, "Telefone"),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\+?\d[\d\s()-]{9,20}$/, "Informe o WhatsApp com DDI e DDD, ex.: +55 18 3321-1449"),
    email: z.string().trim().email("E-mail inválido").max(190),
    street: required(160, "Logradouro"),
    number: required(20, "Número"),
    district: text(80),
    city: required(80, "Cidade"),
    state: z.string().trim().length(2, "Use a sigla do estado, ex.: SP").toUpperCase(),
    zip: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
    instagram: optionalUrl,
    instagramHandle: text(60),
    facebook: optionalUrl,
    googleReviewsUrl: optionalUrl,
    googleRating: z.coerce.number().min(0).max(5),
    googleReviewCount: z.coerce.number().int().min(0).max(1_000_000),
    yearsLabel: text(30),
    serviceArea: text(80),
  }),
  hours: z.array(hourSchema).max(10),
  hoursNote: text(200),
  home: z.object({
    heroEyebrow: text(80),
    heroTitle: required(120, "Título principal"),
    heroSubtitle: text(260),
    heroImage: mediaUrl,
    highlightTitle: required(120, "Título"),
    highlightSubtitle: text(260),
    highlights: z.array(highlightSchema).min(1).max(3),
    aboutTitle: required(120, "Título"),
    aboutText: required(1200, "Texto"),
    aboutImage: mediaUrl,
    ctaTitle: required(140, "Título"),
    ctaText: text(260),
  }),
  about: z.object({
    pageIntro: text(400),
    body: text(4000),
  }),
  seo: z.object({
    title: required(70, "Título SEO"),
    description: required(170, "Descrição SEO"),
    ogImage: mediaUrl,
  }),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type Highlight = z.infer<typeof highlightSchema>;

/**
 * Valores iniciais — somente informações fornecidas pela própria empresa.
 * Todos podem ser alterados em Painel → Configurações do site.
 */
export const defaultSettings: SiteSettings = {
  company: {
    name: "Casa Tentudo Materiais para Construção",
    shortName: "Casa Tentudo",
    slogan: "Da fundação ao acabamento, sua construção começa aqui.",
    phone: "(18) 3321-1449",
    whatsapp: "+55 18 3321-1449",
    email: "casatentudo@hotmail.com",
    street: "Avenida Rui Barbosa",
    number: "2644",
    district: "Jardim Paulista",
    city: "Assis",
    state: "SP",
    zip: "19815-001",
    instagram: "https://www.instagram.com/casatentudo/",
    instagramHandle: "@casatentudo",
    facebook: "https://www.facebook.com/search/top?q=Casa%20Tentudo%20Assis",
    googleReviewsUrl:
      "https://www.google.com/maps/search/?api=1&query=Casa+Tentudo+Materiais+para+Constru%C3%A7%C3%A3o+Av.+Rui+Barbosa+2644+Assis+SP",
    googleRating: 4.7,
    googleReviewCount: 129,
    yearsLabel: "+20 anos",
    serviceArea: "Assis e região",
  },
  hours: [],
  hoursNote: "Confirme nosso horário de atendimento pelo telefone ou WhatsApp.",
  home: {
    heroEyebrow: "Materiais para construção em Assis/SP",
    heroTitle: "Tudo para construir. Tudo para transformar.",
    heroSubtitle: "Há mais de 20 anos oferecendo soluções em materiais para construção para Assis e região.",
    heroImage: "",
    highlightTitle: "Encontre o que sua obra precisa.",
    highlightSubtitle: "Da primeira fiada de tijolos ao último detalhe do acabamento, conte com quem conhece Assis e região.",
    highlights: [
      { title: "Construir", text: "Para quem está começando do zero e precisa de uma base sólida para a obra.", image: "" },
      { title: "Reformar", text: "Para renovar ambientes, corrigir o que for preciso e dar nova vida à casa.", image: "" },
      { title: "Acabar", text: "Para os detalhes finais que transformam a obra em um lar.", image: "" },
    ],
    aboutTitle: "Mais de duas décadas construindo confiança.",
    aboutText:
      "A Casa Tentudo é uma loja de materiais para construção que há mais de 20 anos atende Assis e região. Nossa história é construída junto com clientes que buscam soluções para suas obras, reformas e projetos.",
    aboutImage: "",
    ctaTitle: "Sua próxima construção começa com a escolha certa.",
    ctaText: "Entre em contato com a Casa Tentudo e converse com nossa equipe.",
  },
  about: {
    pageIntro:
      "Uma loja tradicional de Assis que oferece variedade, atendimento próximo e soluções para quem deseja construir, reformar ou melhorar sua casa.",
    body:
      "A Casa Tentudo é uma loja de materiais para construção que há mais de 20 anos atende Assis e região. Nossa história é construída junto com clientes que buscam soluções para suas obras, reformas e projetos.",
  },
  seo: {
    title: "Casa Tentudo | Materiais para Construção em Assis/SP",
    description:
      "Loja de materiais para construção em Assis/SP há mais de 20 anos. Consulte produtos, fale pelo WhatsApp (18) 3321-1449 e visite-nos na Av. Rui Barbosa, 2644.",
    ogImage: "",
  },
};

/** Mescla profunda dos valores salvos sobre os padrões, tolerando campos novos/ausentes. */
export function mergeSettings(saved: unknown): SiteSettings {
  const merged = deepMerge(defaultSettings, saved);
  const parsed = siteSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultSettings;
}

function deepMerge<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as T;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    if (override && typeof override === "object" && !Array.isArray(override)) {
      for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
        if (k in out) out[k] = deepMerge(out[k], v);
      }
    }
    return out as T;
  }
  return (override === undefined || override === null ? base : override) as T;
}

export function fullAddress(c: SiteSettings["company"]) {
  const district = c.district ? `, ${c.district}` : "";
  return `${c.street}, ${c.number}${district}, ${c.city} - ${c.state}, ${c.zip}`;
}

export function mapsQuery(c: SiteSettings["company"]) {
  return `${c.shortName}, ${c.street}, ${c.number}, ${c.city} - ${c.state}, ${c.zip}`;
}

export function directionsUrl(c: SiteSettings["company"]) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(c))}`;
}

export function mapEmbedUrl(c: SiteSettings["company"]) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery(c))}&z=16&output=embed&hl=pt-BR`;
}
