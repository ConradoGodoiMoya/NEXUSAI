import { digitsOnly } from "./format";

/** Monta um link oficial wa.me com mensagem pré-preenchida (funciona em celular e computador). */
export function whatsappLink(number: string, message?: string): string {
  const phone = digitsOnly(number);
  const base = `https://wa.me/${phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const whatsappMessages = {
  general: "Olá! Vim pelo site da Casa Tem Tudo e gostaria de falar com a equipe.",
  product: (name: string) => `Olá! Gostaria de saber mais sobre o produto ${name}.`,
  category: (name: string) => `Olá! Gostaria de consultar os produtos da categoria ${name}.`,
  quote: "Olá! Gostaria de fazer um orçamento de materiais para minha obra.",
};
