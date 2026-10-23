// Recorte do fundo liso das imagens de render da Blizzard (cinza escuro
// uniforme). Pinta de transparente só o fundo ligado às bordas: uma parte
// escura no meio da montaria, cercada por ela, nunca é apagada.

export interface CutOptions {
  /** Distância de cor até a qual o pixel vira 100% transparente. */
  solid: number;
  /** Até aqui fica semitransparente (borda suave); acima disso é a montaria. */
  soft: number;
}

// Calibrado com renders reais: mais folga apagava partes de montarias pretas.
const DEFAULTS: CutOptions = { solid: 4, soft: 10 };

/**
 * Altera `data` (RGBA, 4 canais) no lugar. Devolve false sem mexer em nada
 * se os quatro cantos não tiverem a mesma cor (fundo não é liso).
 */
export function removeFlatBackground(
  data: Uint8Array,
  width: number,
  height: number,
  options: CutOptions = DEFAULTS,
): boolean {
  if (width < 2 || height < 2 || data.length < width * height * 4) return false;
  const corner = [0, width - 1, (height - 1) * width, height * width - 1];
  const bg = [0, 1, 2].map((c) => Math.round(corner.reduce((sum, p) => sum + data[p * 4 + c]!, 0) / corner.length));
  const dist = (p: number) => {
    const o = p * 4;
    return Math.max(Math.abs(data[o]! - bg[0]!), Math.abs(data[o + 1]! - bg[1]!), Math.abs(data[o + 2]! - bg[2]!));
  };
  if (!corner.every((p) => dist(p) <= options.solid)) return false;

  const seen = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let top = 0;
  const push = (p: number) => {
    if (!seen[p]) {
      seen[p] = 1;
      stack[top++] = p;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (top > 0) {
    const p = stack[--top]!;
    const d = dist(p);
    if (d > options.soft) continue;
    const a = p * 4 + 3;
    data[a] =
      d <= options.solid
        ? 0
        : Math.min(data[a]!, Math.round((255 * (d - options.solid)) / (options.soft - options.solid)));
    const x = p % width;
    if (x > 0) push(p - 1);
    if (x < width - 1) push(p + 1);
    if (p >= width) push(p - width);
    if (p < (height - 1) * width) push(p + width);
  }
  return true;
}

/** true se sobrou algum pixel visível (a imagem não era só fundo). */
export function hasOpaquePixel(data: Uint8Array): boolean {
  for (let i = 3; i < data.length; i += 4) if (data[i]! > 16) return true;
  return false;
}
