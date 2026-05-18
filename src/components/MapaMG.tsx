import { useMemo } from "react";

// Municípios polo das regionais de saúde de MG.
// labelPos = posição do rótulo em relação ao ponto da cidade,
// usada para evitar sobreposição entre nomes próximos.
type LabelPos = "right" | "left" | "top" | "bottom" | "top-right" | "top-left" | "bottom-right" | "bottom-left";
interface Cidade {
  nome: string;
  x: number;
  y: number;
  destaque?: boolean;
  labelPos?: LabelPos;
}

const CIDADES: Cidade[] = [
  // Norte
  { nome: "Januária",             x: 430, y: 110 },
  { nome: "Unaí",                 x: 295, y: 175 },
  { nome: "Montes Claros",        x: 475, y: 195 },
  { nome: "Pirapora",             x: 442, y: 245 },
  { nome: "Pedra Azul",           x: 660, y: 175 },
  // Noroeste / Triângulo
  { nome: "Patos de Minas",       x: 345, y: 290 },
  { nome: "Ituiutaba",            x: 155, y: 335 },
  { nome: "Uberlândia",           x: 230, y: 320 },
  { nome: "Uberaba",              x: 250, y: 385 },
  // Vale do Jequitinhonha / Mucuri
  { nome: "Diamantina",           x: 530, y: 285 },
  { nome: "Teófilo Otoni",        x: 645, y: 260 },
  { nome: "Governador Valadares", x: 620, y: 325 },
  // Central / Metropolitana
  { nome: "Sete Lagoas",          x: 475, y: 355 },
  { nome: "Itabira",              x: 555, y: 360 },
  { nome: "Belo Horizonte",       x: 500, y: 390, destaque: true },
  { nome: "Coronel Fabriciano",   x: 590, y: 370 },
  { nome: "Divinópolis",          x: 430, y: 410 },
  { nome: "Ponte Nova",           x: 565, y: 425 },
  { nome: "Manhuaçu",             x: 625, y: 415 },
  // Sul / Zona da Mata
  { nome: "Passos",               x: 320, y: 445 },
  { nome: "Barbacena",            x: 510, y: 470 },
  { nome: "São João del-Rei",     x: 475, y: 460 },
  { nome: "Ubá",                  x: 565, y: 460 },
  { nome: "Alfenas",              x: 370, y: 490 },
  { nome: "Varginha",             x: 410, y: 500 },
  { nome: "Juiz de Fora",         x: 540, y: 510 },
  { nome: "Leopoldina",           x: 590, y: 495 },
  { nome: "Pouso Alegre",         x: 365, y: 540 },
];

// Conexões entre BH (hub) e demais polos regionais — geradas dinamicamente
const BH_INDEX = CIDADES.findIndex((c) => c.destaque);
const CONEXOES: Array<[number, number]> = CIDADES
  .map((_, i) => [BH_INDEX, i] as [number, number])
  .filter(([a, b]) => a !== b);

// Silhueta simplificada do contorno de Minas Gerais (path estilizado)
const MG_PATH = "M256.2,285.2 L250.4,289.3 L244.2,291.2 L238.4,294.5 L232.4,289.2 L225.2,286.5 L218.0,283.5 L209.7,286.3 L202.2,285.9 L193.3,284.4 L182.1,286.5 L173.6,283.1 L167.5,288.2 L160.7,289.2 L156.2,293.2 L152.1,298.7 L144.8,303.9 L135.7,294.5 L128.8,299.3 L119.7,303.8 L107.6,301.3 L101.3,305.6 L89.0,306.4 L82.5,314.2 L75.9,321.7 L73.9,329.8 L64.7,335.5 L59.1,338.9 L53.7,345.5 L53.1,357.4 L44.3,359.1 L42.7,364.9 L40.1,375.6 L40.6,383.0 L41.5,391.1 L43.9,393.7 L49.2,390.7 L62.1,385.9 L69.1,379.5 L77.1,377.5 L90.6,383.4 L99.6,383.2 L108.4,386.2 L117.0,387.0 L131.4,386.2 L139.2,388.1 L151.8,388.8 L151.8,392.5 L151.6,402.1 L156.4,411.1 L166.7,401.3 L172.8,404.8 L177.1,419.7 L178.8,414.3 L180.4,405.2 L185.1,401.9 L197.2,400.1 L206.4,399.5 L215.1,398.7 L219.1,396.4 L224.0,397.6 L234.2,399.4 L239.0,395.3 L243.9,396.3 L245.1,390.7 L256.4,391.5 L262.4,391.1 L270.1,389.1 L273.7,396.5 L280.9,400.8 L285.0,406.0 L281.6,417.5 L285.6,423.0 L291.2,427.6 L293.8,432.9 L289.1,436.7 L285.5,443.0 L285.4,446.6 L290.8,454.8 L292.6,462.7 L292.4,467.9 L299.0,478.0 L304.4,483.3 L310.6,479.8 L316.9,481.2 L324.8,483.7 L331.7,487.5 L328.8,498.1 L323.9,505.5 L322.8,512.7 L324.7,520.1 L321.7,524.9 L322.8,526.4 L322.9,532.1 L319.0,537.1 L321.6,547.2 L329.1,550.7 L337.8,556.4 L334.3,563.9 L340.5,568.6 L340.4,573.4 L346.6,577.1 L355.5,576.5 L361.3,578.3 L370.5,574.0 L379.6,574.4 L381.9,567.0 L378.3,565.2 L382.0,560.4 L386.5,559.1 L389.2,561.6 L391.7,562.6 L398.1,558.6 L407.6,560.3 L417.7,555.7 L422.5,552.1 L431.3,551.1 L439.2,548.1 L441.8,545.8 L451.0,545.0 L461.6,540.0 L473.2,537.2 L481.5,536.0 L487.1,531.6 L503.9,526.8 L512.5,525.3 L518.1,525.8 L524.3,525.1 L535.9,520.7 L543.5,522.3 L549.8,522.3 L549.0,527.2 L556.1,524.7 L565.9,517.8 L583.7,510.5 L598.4,504.2 L605.1,499.6 L599.2,497.6 L604.3,490.0 L605.0,483.5 L607.6,478.0 L608.0,474.1 L609.3,467.4 L615.1,460.7 L613.7,455.4 L620.3,451.2 L627.3,445.8 L630.9,440.8 L633.0,430.1 L634.0,422.5 L633.3,417.8 L636.8,410.4 L644.3,404.7 L662.6,403.6 L667.4,392.4 L669.8,387.6 L675.2,384.3 L676.0,376.3 L676.4,370.2 L684.9,363.6 L690.9,356.6 L691.3,349.1 L691.7,343.0 L689.6,334.7 L683.4,330.4 L683.1,323.2 L676.6,317.6 L672.3,313.7 L685.7,316.3 L691.2,312.0 L684.0,303.2 L675.6,290.6 L681.1,278.8 L686.4,272.4 L697.3,271.9 L693.6,261.4 L700.3,259.5 L706.4,263.8 L712.5,258.2 L728.1,257.3 L737.5,261.0 L738.2,255.5 L737.4,245.1 L732.6,241.3 L724.9,236.4 L720.3,231.3 L713.3,224.9 L716.5,216.0 L714.5,207.4 L716.8,196.6 L723.9,190.4 L728.3,189.6 L735.7,186.8 L730.4,182.8 L731.6,177.0 L740.7,170.4 L744.8,162.2 L752.5,153.3 L759.4,145.7 L759.4,137.4 L754.6,132.7 L747.6,130.5 L741.6,127.3 L736.7,120.5 L724.4,120.6 L715.6,120.5 L707.9,113.8 L701.5,112.5 L693.6,113.3 L688.7,113.0 L679.5,116.6 L670.0,116.9 L664.3,100.9 L657.9,95.1 L635.0,75.2 L625.8,80.0 L616.6,80.4 L605.6,76.7 L599.9,75.0 L594.2,72.6 L589.5,67.5 L582.8,64.7 L574.5,60.1 L566.5,54.1 L561.3,49.8 L552.3,48.2 L530.8,50.6 L524.0,56.7 L520.4,52.5 L503.6,47.5 L502.1,37.2 L507.7,26.0 L500.3,23.4 L490.7,22.4 L480.2,20.0 L470.3,21.7 L460.7,24.9 L451.2,29.6 L437.6,42.4 L426.1,48.6 L418.4,51.5 L409.4,57.9 L402.7,63.7 L397.5,66.1 L389.3,69.5 L381.4,76.4 L369.8,77.2 L362.7,81.6 L357.1,81.8 L366.2,71.0 L362.2,60.5 L356.9,63.5 L346.1,64.0 L343.6,58.7 L333.9,49.6 L329.5,52.7 L330.9,59.0 L331.2,66.7 L330.6,72.3 L320.6,72.4 L304.9,72.3 L304.1,81.9 L308.2,87.0 L305.7,95.2 L307.6,108.0 L311.2,115.7 L312.6,124.8 L296.4,129.2 L286.5,132.5 L280.0,135.5 L277.3,141.8 L277.4,150.9 L272.4,161.4 L272.2,168.6 L281.5,174.6 L285.5,179.7 L286.7,187.3 L290.1,194.7 L288.6,200.3 L282.1,204.9 L275.3,213.7 L268.6,220.3 L265.4,227.2 L269.9,232.2 L279.0,231.5 L282.0,239.2 L279.6,244.5 L278.0,255.8 L279.1,266.8 L272.3,272.9 L265.2,276.3 L259.2,281.1 L256.2,285.2 Z";

export const MapaMG = () => {
  const linhas = useMemo(
    () =>
      CONEXOES.map(([a, b], idx) => {
        const A = CIDADES[a];
        const B = CIDADES[b];
        // controle de curva para arco suave
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2 - 30;
        return { d: `M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}`, delay: idx * 0.15 };
      }),
    []
  );

  // Posicionamento automático de rótulos com detecção de colisão.
  // Para cada cidade, testamos 8 posições candidatas e escolhemos a primeira
  // que não colide com nenhum rótulo já posicionado nem com nenhum ponto de cidade.
  const placedLabels = useMemo(() => {
    const ALL_POS: LabelPos[] = [
      "right", "left", "top", "bottom",
      "top-right", "top-left", "bottom-right", "bottom-left",
    ];
    const offset = 9;
    const charW = (fontSize: number) => fontSize * 0.58; // largura aprox por caractere
    const padding = 2;

    type Box = { x: number; y: number; w: number; h: number };
    const boxes: Box[] = [];

    const computeBox = (c: Cidade, pos: LabelPos): Box => {
      const fs = c.destaque ? 12 : 10.5;
      const w = c.nome.length * charW(fs) + padding * 2;
      const h = fs + padding * 2;
      let cx = c.x;
      let cy = c.y;
      // dx/dy do ponto da cidade até o centro do rótulo
      const dx = pos.includes("left") ? -offset - w / 2
               : pos.includes("right") ? offset + w / 2
               : 0;
      const dy = pos.includes("top") ? -offset - h / 2
               : pos.includes("bottom") ? offset + h / 2
               : (pos === "left" || pos === "right") ? 0
               : 0;
      cx += dx;
      cy += dy;
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    };

    const overlaps = (a: Box, b: Box) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    // Bounding boxes dos pontos das cidades (raio pequeno) para evitar
    // que um rótulo cubra outro ponto de cidade.
    const cityPointBoxes: Box[] = CIDADES.map((c) => ({
      x: c.x - 4, y: c.y - 4, w: 8, h: 8,
    }));

    // Ordenar: cidades destaque primeiro, depois por y (norte → sul)
    const order = CIDADES
      .map((c, i) => ({ c, i }))
      .sort((a, b) => {
        if (a.c.destaque && !b.c.destaque) return -1;
        if (!a.c.destaque && b.c.destaque) return 1;
        return a.c.y - b.c.y;
      });

    const result: Record<number, { pos: LabelPos; box: Box }> = {};

    for (const { c, i } of order) {
      let chosen: { pos: LabelPos; box: Box } | null = null;
      let bestFallback: { pos: LabelPos; box: Box; collisions: number } | null = null;
      for (const pos of ALL_POS) {
        const box = computeBox(c, pos);
        let collisions = 0;
        for (const b of boxes) if (overlaps(box, b)) collisions++;
        for (let k = 0; k < cityPointBoxes.length; k++) {
          if (k !== i && overlaps(box, cityPointBoxes[k])) collisions++;
        }
        if (collisions === 0) { chosen = { pos, box }; break; }
        if (!bestFallback || collisions < bestFallback.collisions) {
          bestFallback = { pos, box, collisions };
        }
      }
      const final = chosen ?? bestFallback!;
      result[i] = { pos: final.pos, box: final.box };
      boxes.push(final.box);
    }
    return result;
  }, []);

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Mapa de Minas Gerais com conexões entre as principais cidades"
        role="img"
      >
        <defs>
          <linearGradient id="mgFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="cityGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Silhueta do estado */}
        <path
          d={MG_PATH}
          fill="url(#mgFill)"
          stroke="hsl(var(--primary-foreground))"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />

        {/* Linhas de conexão */}
        <g>
          {linhas.map((l, i) => (
            <path
              key={i}
              d={l.d}
              stroke="url(#lineGrad)"
              strokeWidth="1.2"
              strokeLinecap="round"
              style={{
                strokeDasharray: 600,
                strokeDashoffset: 600,
                animation: `mg-draw 2.4s ${l.delay}s ease-out forwards`,
              }}
            />
          ))}
        </g>

        {/* Cidades */}
        <g>
          {CIDADES.map((c, i) => {
            const pos = placedLabels[i]?.pos ?? c.labelPos ?? "right";
            const offset = 9;
            // anchor + (dx, dy) por posição
            const map: Record<LabelPos, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
              right:        { dx:  offset,    dy: 4,         anchor: "start" },
              left:         { dx: -offset,    dy: 4,         anchor: "end" },
              top:          { dx: 0,          dy: -offset,   anchor: "middle" },
              bottom:       { dx: 0,          dy:  offset+8, anchor: "middle" },
              "top-right":  { dx:  offset,    dy: -offset+2, anchor: "start" },
              "top-left":   { dx: -offset,    dy: -offset+2, anchor: "end" },
              "bottom-right": { dx:  offset,  dy:  offset+8, anchor: "start" },
              "bottom-left":  { dx: -offset,  dy:  offset+8, anchor: "end" },
            };
            const { dx, dy, anchor } = map[pos];
            return (
              <g key={c.nome} style={{ animation: `mg-pop 0.5s ${0.3 + i * 0.06}s both` }}>
                {c.destaque && <circle cx={c.x} cy={c.y} r="22" fill="url(#cityGlow)" />}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={c.destaque ? 6 : 3.5}
                  fill="hsl(var(--primary-foreground))"
                />
                {c.destaque && (
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="10"
                    fill="none"
                    stroke="hsl(var(--primary-foreground))"
                    strokeOpacity="0.6"
                    strokeWidth="1.2"
                    style={{ animation: "mg-pulse 2.4s ease-out infinite" }}
                  />
                )}
                {/* halo do texto para legibilidade */}
                <text
                  x={c.x + dx}
                  y={c.y + dy}
                  fontSize={c.destaque ? 12 : 10.5}
                  textAnchor={anchor}
                  fill="hsl(var(--primary))"
                  fillOpacity="0.55"
                  stroke="hsl(var(--primary))"
                  strokeOpacity="0.55"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: c.destaque ? 700 : 500 }}
                >
                  {c.nome}
                </text>
                <text
                  x={c.x + dx}
                  y={c.y + dy}
                  fontSize={c.destaque ? 12 : 10.5}
                  textAnchor={anchor}
                  fill="hsl(var(--primary-foreground))"
                  fillOpacity={c.destaque ? 1 : 0.95}
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: c.destaque ? 700 : 500 }}
                >
                  {c.nome}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <style>{`
        @keyframes mg-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes mg-pop {
          from { opacity: 0; transform: scale(0.4); transform-origin: center; }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes mg-pulse {
          0% { r: 8; opacity: 0.8; }
          100% { r: 26; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MapaMG;