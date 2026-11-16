import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casa Tentudo Materiais para Construção",
    short_name: "Casa Tentudo",
    description: "Materiais para construção em Assis/SP há mais de 20 anos.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B1B36",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
