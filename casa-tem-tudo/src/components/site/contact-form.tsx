"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/brand-icons";

const SUBJECTS = ["Orçamento de materiais", "Consulta de produto", "Disponibilidade", "Outro assunto"];

/**
 * Formulário que monta a mensagem e abre o WhatsApp da loja — sem armazenar dados pessoais
 * e sem depender de servidor de e-mail. O cliente revisa a mensagem antes de enviar.
 */
export function ContactForm({ whatsapp, email }: { whatsapp: string; email: string }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function compose() {
    const lines = [`Olá! Meu nome é ${name.trim()}.`, `Assunto: ${subject}.`, "", message.trim()];
    return lines.join("\n");
  }

  function validate() {
    if (name.trim().length < 2) return "Informe seu nome.";
    if (message.trim().length < 5) return "Escreva sua mensagem.";
    return null;
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const err = validate();
        setError(err);
        if (err) return;
        const digits = whatsapp.replace(/\D/g, "");
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(compose())}`, "_blank", "noopener,noreferrer");
      }}
      className="space-y-5"
    >
      <div>
        <label htmlFor="cf-name" className="label">Seu nome</label>
        <input id="cf-name" className="input h-12" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} required />
      </div>
      <div>
        <label htmlFor="cf-subject" className="label">Assunto</label>
        <select id="cf-subject" className="input h-12" value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="cf-message" className="label">Mensagem</label>
        <textarea
          id="cf-message"
          className="input min-h-[140px] resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          placeholder="Conte o que você precisa: produtos, quantidades, medidas…"
          required
        />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn btn-whatsapp btn-lg flex-1">
          <WhatsAppIcon className="h-5 w-5" /> Enviar pelo WhatsApp
        </button>
        <button
          type="button"
          className="btn btn-outline btn-lg"
          onClick={() => {
            const err = validate();
            setError(err);
            if (err) return;
            window.location.href = `mailto:${email}?subject=${encodeURIComponent(`[Site] ${subject}`)}&body=${encodeURIComponent(compose())}`;
          }}
        >
          <Send className="h-4 w-4" aria-hidden="true" /> Por e-mail
        </button>
      </div>
      <p className="text-xs text-graphite-500">Ao enviar, você revisa a mensagem no WhatsApp (ou no seu e-mail) antes de confirmar. Nenhum dado é armazenado no site.</p>
    </form>
  );
}
