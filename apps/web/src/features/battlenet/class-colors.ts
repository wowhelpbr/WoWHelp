// Cores oficiais das classes do World of Warcraft (as mesmas do jogo), para a
// barrinha ao lado de cada personagem. Procura pelo nome da classe em inglês
// ou português, como vem da Battle.net. Ordem importa: "caçador de demônios"
// antes de "caçador".

const COLORS: [RegExp, string][] = [
  [/demon ?hunter|caçador(a)? de demônios/i, '#a330c9'],
  [/death ?knight|cavaleir[oa] da morte/i, '#c41e3a'],
  [/warrior|guerreir/i, '#c69b6d'],
  [/paladin/i, '#f48cba'],
  [/hunter|caçador/i, '#aad372'],
  [/rogue|ladin/i, '#fff468'],
  [/priest|sacerdot/i, '#ffffff'],
  [/shaman|xam/i, '#0070dd'],
  [/mage|mag[oa]\b/i, '#3fc7eb'],
  [/warlock|brux[oa]/i, '#8788ee'],
  [/monk|mong/i, '#00ff98'],
  [/druid/i, '#ff7c0a'],
  [/evoker|conjurante|evocador/i, '#33937f'],
];

export function classColor(className: string | null): string {
  if (!className) return '#3a4655';
  return COLORS.find(([re]) => re.test(className))?.[1] ?? '#3a4655';
}
