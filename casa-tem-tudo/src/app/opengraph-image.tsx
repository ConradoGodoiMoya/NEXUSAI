import { ImageResponse } from "next/og";

export const alt = "Casa Tentudo — Materiais para Construção em Assis/SP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #071126 0%, #10264A 60%, #16335F 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: 26, background: "#F26B1D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 800 }}>
            ⌂
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 48, fontWeight: 800, display: "flex" }}>
              Casa&nbsp;<span style={{ color: "#F7802F" }}>Tentudo</span>
            </div>
            <div style={{ fontSize: 22, letterSpacing: 6, color: "#B3C6E3" }}>MATERIAIS PARA CONSTRUÇÃO</div>
          </div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 950, display: "flex" }}>
          Tudo para construir. Tudo para transformar.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#D9E3F2" }}>
          <span>Há mais de 20 anos em Assis/SP</span>
          <span>(18) 3321-1449</span>
        </div>
      </div>
    ),
    size,
  );
}
