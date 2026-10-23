import { describe, expect, it } from 'vitest';
import { hasOpaquePixel, removeFlatBackground } from '@/features/catalog/background';

// Imagem sintética 10x10: fundo cinza (24,24,24) como os renders da Blizzard,
// um quadrado vermelho no meio e, dentro dele, um pixel da cor do fundo.
function image(fill: (x: number, y: number) => [number, number, number]) {
  const w = 10;
  const h = 10;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fill(x, y);
      data.set([r, g, b, 255], (y * w + x) * 4);
    }
  }
  return { data, w, h, alpha: (x: number, y: number) => data[(y * w + x) * 4 + 3] };
}

const BG: [number, number, number] = [24, 24, 24];
const RED: [number, number, number] = [200, 30, 30];

describe('recorte do fundo dos renders', () => {
  it('apaga o fundo ligado às bordas e mantém a montaria', () => {
    const img = image((x, y) => {
      if (x === 5 && y === 5) return BG; // "buraco" escuro dentro da montaria
      return x >= 3 && x <= 6 && y >= 3 && y <= 6 ? RED : BG;
    });
    expect(removeFlatBackground(img.data, img.w, img.h)).toBe(true);
    expect(img.alpha(0, 0)).toBe(0);
    expect(img.alpha(9, 9)).toBe(0);
    expect(img.alpha(2, 4)).toBe(0);
    expect(img.alpha(4, 4)).toBe(255);
    // Cercado pela montaria: não é fundo, continua visível.
    expect(img.alpha(5, 5)).toBe(255);
    expect(hasOpaquePixel(img.data)).toBe(true);
  });

  it('pixel quase da cor do fundo na borda fica semitransparente', () => {
    const img = image((x, y) => (x === 3 && y === 0 ? [31, 31, 31] : BG));
    removeFlatBackground(img.data, img.w, img.h);
    expect(img.alpha(3, 0)).toBeGreaterThan(0);
    expect(img.alpha(3, 0)).toBeLessThan(255);
  });

  it('não mexe quando os cantos têm cores diferentes', () => {
    const img = image((x, y) => (x === 0 && y === 0 ? RED : BG));
    expect(removeFlatBackground(img.data, img.w, img.h)).toBe(false);
    expect(img.alpha(5, 5)).toBe(255);
  });

  it('imagem só de fundo fica sem pixel visível', () => {
    const img = image(() => BG);
    removeFlatBackground(img.data, img.w, img.h);
    expect(hasOpaquePixel(img.data)).toBe(false);
  });
});
