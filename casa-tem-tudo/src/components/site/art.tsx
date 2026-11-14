/**
 * Ilustrações vetoriais da marca. São exibidas enquanto a loja não envia fotografias reais
 * pelo painel (Configurações do site → Imagens). Leves, nítidas e sem custo de carregamento.
 */

export function HouseIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 520" className={className} role="img" aria-label="Ilustração de uma casa moderna em construção">
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7F9CC9" />
          <stop offset=".55" stopColor="#2C548F" />
          <stop offset="1" stopColor="#16335F" />
        </linearGradient>
        <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D08A52" />
          <stop offset="1" stopColor="#A9663A" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E6EBF2" />
        </linearGradient>
        <radialGradient id="sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#F26B1D" stopOpacity=".55" />
          <stop offset="1" stopColor="#F26B1D" stopOpacity="0" />
        </radialGradient>
        <clipPath id="g1"><rect x="222" y="214" width="108" height="98" rx="3" /></clipPath>
        <clipPath id="g2"><rect x="112" y="330" width="138" height="110" rx="3" /></clipPath>
        <clipPath id="g3"><rect x="362" y="312" width="150" height="72" rx="3" /></clipPath>
      </defs>

      <circle cx="455" cy="150" r="120" fill="url(#sun)" />

      {/* Grua — detalhe de construção */}
      <g stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none">
        <path d="M500 440V70M516 440V70M500 90l16 20M516 110l-16 20M500 130l16 20M516 150l-16 20M500 170l16 20M516 190l-16 20M500 210l16 20M516 230l-16 20M500 250l16 20M516 270l-16 20" />
        <path d="M300 70h290M300 84h290M508 40v30M508 40L330 70M508 40l80 30" />
        <path d="M360 84v60" strokeDasharray="4 4" />
      </g>
      <rect x="350" y="144" width="20" height="14" rx="2" fill="#F26B1D" />

      {/* Cotas */}
      <g stroke="#fff" strokeOpacity=".45" strokeWidth="1.5">
        <path d="M70 160h300M70 152v16M370 152v16" />
        <path d="M44 202v238M36 202h16M36 440h16" />
      </g>

      {/* Chão */}
      <rect x="20" y="440" width="560" height="10" rx="5" fill="#fff" fillOpacity=".18" />
      <rect x="60" y="450" width="480" height="40" rx="20" fill="#071126" fillOpacity=".35" />

      {/* Volume principal */}
      <rect x="90" y="200" width="250" height="240" fill="url(#wall)" />
      <rect x="70" y="186" width="304" height="16" rx="2" fill="#fff" />
      <rect x="70" y="200" width="304" height="4" fill="#F26B1D" />

      {/* Painel ripado */}
      <rect x="108" y="214" width="98" height="98" rx="3" fill="url(#wood)" />
      <g stroke="#8A5230" strokeOpacity=".55" strokeWidth="2">
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d={`M${116 + i * 8} 216v94`} />
        ))}
      </g>

      {/* Vidro superior */}
      <rect x="222" y="214" width="108" height="98" rx="3" fill="url(#glass)" />
      <g clipPath="url(#g1)">
        <rect x="200" y="200" width="40" height="140" fill="url(#glassShine)" transform="rotate(18 220 260)" />
      </g>
      <path d="M276 214v98M222 263h108" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
      <rect x="218" y="310" width="116" height="5" rx="2" fill="#fff" />

      {/* Laje intermediária */}
      <rect x="90" y="316" width="250" height="8" fill="#C3C9D3" />

      {/* Vidro térreo / porta */}
      <rect x="112" y="330" width="138" height="110" rx="3" fill="url(#glass)" />
      <g clipPath="url(#g2)">
        <rect x="120" y="300" width="44" height="170" fill="url(#glassShine)" transform="rotate(18 140 380)" />
      </g>
      <path d="M158 330v110M204 330v110" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
      <rect x="264" y="342" width="56" height="98" rx="3" fill="#0B1B36" />
      <circle cx="310" cy="392" r="3" fill="#F26B1D" />

      {/* Volume lateral */}
      <rect x="340" y="292" width="192" height="148" fill="#DDE3EC" />
      <rect x="330" y="278" width="214" height="16" rx="2" fill="#fff" />
      <rect x="362" y="312" width="150" height="72" rx="3" fill="url(#glass)" />
      <g clipPath="url(#g3)">
        <rect x="380" y="290" width="36" height="120" fill="url(#glassShine)" transform="rotate(18 400 350)" />
      </g>
      <path d="M412 312v72M462 312v72" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
      <rect x="352" y="400" width="170" height="40" fill="#C3C9D3" />
      <g stroke="#98A1B0" strokeWidth="1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <path key={i} d={`M352 ${408 + i * 8}h170`} />
        ))}
      </g>

      {/* Paisagismo */}
      <g>
        <ellipse cx="62" cy="400" rx="30" ry="44" fill="#1E4176" />
        <ellipse cx="62" cy="392" rx="20" ry="32" fill="#2C548F" />
        <path d="M62 440v-30" stroke="#0B1B36" strokeWidth="4" />
        <rect x="548" y="410" width="28" height="30" rx="4" fill="#fff" fillOpacity=".85" />
        <ellipse cx="562" cy="398" rx="20" ry="22" fill="#2C548F" />
      </g>
    </svg>
  );
}

export function StorefrontIllustration({ className, name = "Casa Tem Tudo" }: { className?: string; name?: string }) {
  return (
    <svg viewBox="0 0 560 420" className={className} role="img" aria-label={`Ilustração da fachada da loja ${name}`}>
      <defs>
        <linearGradient id="sfGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B3C6E3" />
          <stop offset="1" stopColor="#4D72AD" />
        </linearGradient>
        <pattern id="awning" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="20" height="40" fill="#F26B1D" />
          <rect x="20" width="20" height="40" fill="#fff" />
        </pattern>
      </defs>
      <rect x="40" y="360" width="480" height="10" rx="5" fill="#C3C9D3" />
      <rect x="60" y="60" width="440" height="300" rx="6" fill="#fff" />
      <rect x="60" y="60" width="440" height="78" rx="6" fill="#0B1B36" />
      <text x="280" y="108" textAnchor="middle" fontFamily="var(--font-jakarta), sans-serif" fontWeight="800" fontSize="30" fill="#fff" letterSpacing="-0.5">
        CASA TEM <tspan fill="#F26B1D">TUDO</tspan>
      </text>
      <text x="280" y="128" textAnchor="middle" fontFamily="var(--font-inter), sans-serif" fontWeight="600" fontSize="10" fill="#B3C6E3" letterSpacing="3">
        MATERIAIS PARA CONSTRUÇÃO
      </text>
      <path d="M50 138h460l-18 40H68z" fill="url(#awning)" />
      <path d="M68 178h424" stroke="#A63D0B" strokeWidth="3" />
      <rect x="86" y="200" width="150" height="160" rx="4" fill="url(#sfGlass)" />
      <rect x="324" y="200" width="150" height="160" rx="4" fill="url(#sfGlass)" />
      <rect x="250" y="210" width="60" height="150" rx="4" fill="#16335F" />
      <circle cx="298" cy="290" r="3.5" fill="#F26B1D" />
      <g fill="#fff" fillOpacity=".85">
        <rect x="100" y="300" width="36" height="40" rx="3" />
        <rect x="142" y="290" width="30" height="50" rx="3" />
        <rect x="178" y="310" width="44" height="30" rx="3" />
        <rect x="340" y="296" width="54" height="44" rx="3" />
        <rect x="400" y="306" width="60" height="34" rx="3" />
      </g>
      <g fill="#F26B1D">
        <rect x="104" y="306" width="28" height="8" rx="2" />
        <rect x="346" y="304" width="42" height="8" rx="2" />
      </g>
      <path d="M86 236h150M324 236h150" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
    </svg>
  );
}

/** Composições abstratas para a seção “Encontre o que sua obra precisa”. */
export function SceneArt({ variant, className }: { variant: number; className?: string }) {
  const v = variant % 3;
  if (v === 0) {
    // Construir — parede de tijolos com fiadas desencontradas
    return (
      <svg viewBox="0 0 400 300" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="300" fill="#10264A" />
        {Array.from({ length: 10 }, (_, row) =>
          Array.from({ length: 7 }, (_, col) => {
            const x = col * 64 - (row % 2 ? 32 : 0) + 4;
            const y = row * 30 + 4;
            const accent = (row * 7 + col) % 9 === 0;
            return (
              <rect key={`${row}-${col}`} x={x} y={y} width="58" height="24" rx="3" fill={accent ? "#F26B1D" : "#16335F"} fillOpacity={accent ? 0.9 : 1} />
            );
          }),
        )}
      </svg>
    );
  }
  if (v === 1) {
    // Reformar — pinceladas de rolo
    return (
      <svg viewBox="0 0 400 300" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <rect width="400" height="300" fill="#16335F" />
        <path d="M-20 70C80 40 180 110 420 60" stroke="#1E4176" strokeWidth="70" fill="none" strokeLinecap="round" />
        <path d="M-20 160C120 120 220 210 420 150" stroke="#F26B1D" strokeWidth="56" fill="none" strokeLinecap="round" opacity=".92" />
        <path d="M-20 250C100 220 260 290 420 240" stroke="#2C548F" strokeWidth="64" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  // Acabar — revestimento em grade com rejunte
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="#0B1B36" />
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => {
          const tone = (row + col) % 4;
          const fill = ["#16335F", "#1E4176", "#10264A", "#F26B1D"][tone === 3 && (row * col) % 5 === 1 ? 3 : tone % 3];
          return <rect key={`${row}-${col}`} x={col * 60 + 4} y={row * 60 + 4} width="54" height="54" rx="4" fill={fill} />;
        }),
      )}
    </svg>
  );
}
