"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { SiteSettings } from "@/lib/settings-schema";
import { api, ApiError } from "./api-client";
import { TextArea, TextField } from "./fields";
import { ImageUpload } from "./image-upload";
import { useToast } from "./toast";

const TABS = [
  { id: "empresa", label: "Empresa e contato" },
  { id: "horarios", label: "Horários" },
  { id: "inicio", label: "Página inicial" },
  { id: "imagens", label: "Imagens e banners" },
  { id: "sobre", label: "Sobre nós" },
  { id: "seo", label: "SEO e Google" },
] as const;

export function SettingsForm({ initial, canEdit }: { initial: SiteSettings; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<SiteSettings>(initial);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("empresa");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const company = <K extends keyof SiteSettings["company"]>(k: K, v: SiteSettings["company"][K]) => setS((x) => ({ ...x, company: { ...x.company, [k]: v } }));
  const home = <K extends keyof SiteSettings["home"]>(k: K, v: SiteSettings["home"][K]) => setS((x) => ({ ...x, home: { ...x.home, [k]: v } }));
  const err = (path: string) => errors[path];

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      await api("/api/admin/settings", { method: "PUT", body: s });
      toast("success", "Configurações salvas. O site já foi atualizado.");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(e.fields ?? {});
        const first = Object.keys(e.fields ?? {})[0];
        if (first) {
          const map: Record<string, (typeof TABS)[number]["id"]> = { company: "empresa", hours: "horarios", hoursNote: "horarios", about: "sobre", seo: "seo" };
          const root = first.split(".")[0];
          setTab(root === "home" ? (/image|Image/.test(first) ? "imagens" : "inicio") : (map[root] ?? "empresa"));
        }
        toast("error", e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  const c = s.company;
  const h = s.home;

  return (
    <div>
      {!canEdit && <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">Somente administradores podem salvar alterações nesta página.</p>}
      <div role="tablist" aria-label="Seções" className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx("whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition", tab === t.id ? "bg-navy-900 text-white" : "text-graphite-600 hover:bg-graphite-100")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <fieldset disabled={!canEdit} className="card space-y-6 p-6 sm:p-8">
        {tab === "empresa" && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Nome completo" value={c.name} onChange={(e) => company("name", e.target.value)} error={err("company.name")} />
              <TextField label="Nome curto" value={c.shortName} onChange={(e) => company("shortName", e.target.value)} error={err("company.shortName")} />
            </div>
            <TextField label="Slogan" value={c.slogan} onChange={(e) => company("slogan", e.target.value)} error={err("company.slogan")} />
            <div className="grid gap-5 sm:grid-cols-3">
              <TextField label="Telefone" value={c.phone} onChange={(e) => company("phone", e.target.value)} error={err("company.phone")} />
              <TextField label="WhatsApp (com DDI)" value={c.whatsapp} onChange={(e) => company("whatsapp", e.target.value)} error={err("company.whatsapp")} help="Usado em todos os botões de WhatsApp." />
              <TextField label="E-mail" type="email" value={c.email} onChange={(e) => company("email", e.target.value)} error={err("company.email")} />
            </div>
            <h3 className="pt-2 font-bold">Endereço</h3>
            <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
              <TextField label="Logradouro" value={c.street} onChange={(e) => company("street", e.target.value)} error={err("company.street")} />
              <TextField label="Número" value={c.number} onChange={(e) => company("number", e.target.value)} error={err("company.number")} />
            </div>
            <div className="grid gap-5 sm:grid-cols-[1fr_1fr_90px_140px]">
              <TextField label="Bairro" value={c.district} onChange={(e) => company("district", e.target.value)} error={err("company.district")} />
              <TextField label="Cidade" value={c.city} onChange={(e) => company("city", e.target.value)} error={err("company.city")} />
              <TextField label="UF" value={c.state} maxLength={2} onChange={(e) => company("state", e.target.value.toUpperCase())} error={err("company.state")} />
              <TextField label="CEP" value={c.zip} onChange={(e) => company("zip", e.target.value)} error={err("company.zip")} />
            </div>
            <h3 className="pt-2 font-bold">Redes sociais</h3>
            <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
              <TextField label="Instagram (link)" value={c.instagram} onChange={(e) => company("instagram", e.target.value)} error={err("company.instagram")} placeholder="https://www.instagram.com/..." />
              <TextField label="Usuário do Instagram" value={c.instagramHandle} onChange={(e) => company("instagramHandle", e.target.value)} />
            </div>
            <TextField label="Facebook (link da página)" value={c.facebook} onChange={(e) => company("facebook", e.target.value)} error={err("company.facebook")} help="Cole aqui o endereço da página oficial no Facebook. Deixe vazio para ocultar o ícone." />
            <h3 className="pt-2 font-bold">Indicadores</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Tempo de história" value={c.yearsLabel} onChange={(e) => company("yearsLabel", e.target.value)} error={err("company.yearsLabel")} help="Ex.: +20 anos" />
              <TextField label="Área de atendimento" value={c.serviceArea} onChange={(e) => company("serviceArea", e.target.value)} error={err("company.serviceArea")} />
            </div>
          </>
        )}

        {tab === "horarios" && (
          <>
            <p className="text-sm text-graphite-600">Cadastre os horários confirmados. Se a lista ficar vazia, o site exibe apenas a observação abaixo.</p>
            <ul className="space-y-3">
              {s.hours.map((hr, i) => (
                <li key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <TextField label="Dias" value={hr.days} placeholder="Ex.: Segunda a sexta" onChange={(e) => setS((x) => ({ ...x, hours: x.hours.map((y, j) => (j === i ? { ...y, days: e.target.value } : y)) }))} error={err(`hours.${i}.days`)} />
                  <TextField label="Horário" value={hr.time} placeholder="Ex.: 7h às 18h" onChange={(e) => setS((x) => ({ ...x, hours: x.hours.map((y, j) => (j === i ? { ...y, time: e.target.value } : y)) }))} error={err(`hours.${i}.time`)} />
                  <button type="button" className="btn h-[46px] text-red-600 hover:bg-red-50" onClick={() => setS((x) => ({ ...x, hours: x.hours.filter((_, j) => j !== i) }))} aria-label="Remover horário">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            {s.hours.length < 10 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setS((x) => ({ ...x, hours: [...x.hours, { days: "", time: "" }] }))}>
                <Plus className="h-4 w-4" /> Adicionar linha
              </button>
            )}
            <TextField label="Observação" value={s.hoursNote} onChange={(e) => setS((x) => ({ ...x, hoursNote: e.target.value }))} error={err("hoursNote")} help="Ex.: feriados, plantões. Pode ficar vazia." />
          </>
        )}

        {tab === "inicio" && (
          <>
            <h3 className="font-bold">Seção principal</h3>
            <TextField label="Chamada acima do título" value={h.heroEyebrow} onChange={(e) => home("heroEyebrow", e.target.value)} error={err("home.heroEyebrow")} />
            <TextField label="Título principal" value={h.heroTitle} onChange={(e) => home("heroTitle", e.target.value)} error={err("home.heroTitle")} help="A parte após o primeiro ponto final aparece em laranja." />
            <TextArea label="Subtítulo" value={h.heroSubtitle} rows={2} onChange={(e) => home("heroSubtitle", e.target.value)} error={err("home.heroSubtitle")} />
            <h3 className="pt-2 font-bold">Seção “Encontre o que sua obra precisa”</h3>
            <TextField label="Título" value={h.highlightTitle} onChange={(e) => home("highlightTitle", e.target.value)} error={err("home.highlightTitle")} />
            <TextArea label="Texto" value={h.highlightSubtitle} rows={2} onChange={(e) => home("highlightSubtitle", e.target.value)} error={err("home.highlightSubtitle")} />
            <div className="grid gap-4 md:grid-cols-3">
              {h.highlights.map((hl, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-graphite-100 p-4">
                  <TextField label={`Bloco ${i + 1} — título`} value={hl.title} onChange={(e) => home("highlights", h.highlights.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)))} error={err(`home.highlights.${i}.title`)} />
                  <TextArea label="Texto" rows={3} value={hl.text} onChange={(e) => home("highlights", h.highlights.map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))} />
                </div>
              ))}
            </div>
            <h3 className="pt-2 font-bold">Sobre (resumo na página inicial)</h3>
            <TextField label="Título" value={h.aboutTitle} onChange={(e) => home("aboutTitle", e.target.value)} error={err("home.aboutTitle")} />
            <TextArea label="Texto" rows={4} value={h.aboutText} onChange={(e) => home("aboutText", e.target.value)} error={err("home.aboutText")} />
            <h3 className="pt-2 font-bold">Chamada final</h3>
            <TextField label="Título" value={h.ctaTitle} onChange={(e) => home("ctaTitle", e.target.value)} error={err("home.ctaTitle")} />
            <TextField label="Texto" value={h.ctaText} onChange={(e) => home("ctaText", e.target.value)} error={err("home.ctaText")} />
          </>
        )}

        {tab === "imagens" && (
          <>
            <p className="text-sm text-graphite-600">Enquanto nenhuma foto for enviada, o site usa ilustrações próprias da marca. Prefira fotos reais da loja, da equipe e de obras — horizontais e com boa iluminação.</p>
            <div className="grid gap-6 md:grid-cols-2">
              <ImageUpload label="Banner principal (topo da página inicial)" kind="banner" aspect="aspect-[6/5]" value={h.heroImage || null} onChange={(u) => home("heroImage", u)} help="Sugestão: 1600 × 1330 px." />
              <ImageUpload label="Foto da loja (seção Sobre)" kind="banner" aspect="aspect-[4/3]" value={h.aboutImage || null} onChange={(u) => home("aboutImage", u)} help="Fachada, interior ou equipe." />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {h.highlights.map((hl, i) => (
                <ImageUpload key={i} label={`Imagem — ${hl.title}`} kind="banner" aspect="aspect-[3/4]" value={hl.image || null} onChange={(u) => home("highlights", h.highlights.map((y, j) => (j === i ? { ...y, image: u } : y)))} />
              ))}
            </div>
          </>
        )}

        {tab === "sobre" && (
          <>
            <TextArea label="Introdução (topo da página Sobre)" rows={3} value={s.about.pageIntro} onChange={(e) => setS((x) => ({ ...x, about: { ...x.about, pageIntro: e.target.value } }))} error={err("about.pageIntro")} />
            <TextArea label="Nossa história" rows={10} value={s.about.body} onChange={(e) => setS((x) => ({ ...x, about: { ...x.about, body: e.target.value } }))} error={err("about.body")} help="Separe parágrafos com uma linha em branco." />
          </>
        )}

        {tab === "seo" && (
          <>
            <TextField label="Título nas buscas" value={s.seo.title} maxLength={70} onChange={(e) => setS((x) => ({ ...x, seo: { ...x.seo, title: e.target.value } }))} error={err("seo.title")} help={`${s.seo.title.length}/70 caracteres`} />
            <TextArea label="Descrição nas buscas" rows={3} maxLength={170} value={s.seo.description} onChange={(e) => setS((x) => ({ ...x, seo: { ...x.seo, description: e.target.value } }))} error={err("seo.description")} help={`${s.seo.description.length}/170 caracteres`} />
            <div className="max-w-md">
              <ImageUpload label="Imagem para compartilhamento (WhatsApp, Facebook)" kind="banner" aspect="aspect-[1200/630]" value={s.seo.ogImage || null} onChange={(u) => setS((x) => ({ ...x, seo: { ...x.seo, ogImage: u } }))} help="1200 × 630 px. Sem imagem, uma arte automática é usada." />
            </div>
            <h3 className="pt-2 font-bold">Google</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Nota média no Google" type="number" step="0.1" min="0" max="5" value={String(c.googleRating)} onChange={(e) => company("googleRating", Number(e.target.value))} error={err("company.googleRating")} />
              <TextField label="Total de avaliações" type="number" min="0" value={String(c.googleReviewCount)} onChange={(e) => company("googleReviewCount", Number(e.target.value))} error={err("company.googleReviewCount")} />
            </div>
            <TextField label="Link das avaliações no Google" value={c.googleReviewsUrl} onChange={(e) => company("googleReviewsUrl", e.target.value)} error={err("company.googleReviewsUrl")} help="No Google Maps, abra a ficha da loja → Compartilhar → Copiar link." />
          </>
        )}
      </fieldset>

      {canEdit && (
        <div className="sticky bottom-4 mt-6 flex justify-end">
          <button onClick={save} className="btn btn-primary btn-lg shadow-lift" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar configurações
          </button>
        </div>
      )}
    </div>
  );
}
