/** Ícones disponíveis para categorias (o componente visual fica em components/category-icon.tsx). */
export const CATEGORY_ICONS = [
  "boxes",
  "brick",
  "package",
  "hammer",
  "wrench",
  "droplets",
  "zap",
  "paint",
  "grid",
  "sparkles",
  "lamp",
  "door",
  "bath",
  "shovel",
  "ruler",
  "home",
] as const;
export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_ICON_LABELS: Record<CategoryIconName, string> = {
  boxes: "Caixas",
  brick: "Tijolos",
  package: "Saco / embalagem",
  hammer: "Martelo",
  wrench: "Chave",
  droplets: "Hidráulica",
  zap: "Elétrica",
  paint: "Pintura",
  grid: "Revestimento",
  sparkles: "Acabamento",
  lamp: "Iluminação",
  door: "Portas",
  bath: "Banheiro",
  shovel: "Pá",
  ruler: "Medição",
  home: "Casa",
};
