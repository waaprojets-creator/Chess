import type { CognitiveItem } from '@/types/chess';

// Sandia Matrices (Matzen et al., 2010) — open research resource
// IRT parameters approximated from Harris et al. (2020) psychometric review
// correctIndex: 0-based index into optionImages array (0=top-left, 7=bottom-right)
// c = 1/8 = 0.125 (8-option items)

function item(
  id: string,
  domain: 'Gf' | 'Gv',
  a: number, b: number,
  correctIndex: number,
): CognitiveItem {
  const opts = Array.from({ length: 8 }, (_, i) =>
    `cognitive/options/${id}_opt${i + 1}.png`
  );
  return {
    id,
    gridImage: `cognitive/grids/${id}.png`,
    optionImages: opts,
    correctIndex,
    irt: { a, b, c: 0.125 },
    domain,
  };
}

// ─── Level 1 — very easy (b ≈ -2.0) ─────────────────────────────────────────
// A = shape/type · B = fill/shade · C = direction · D = size · E = number

export const COGNITIVE_ITEMS: CognitiveItem[] = [
  item('A1_1', 'Gf', 1.1, -2.0, 1),  // shape → outline square = opt2
  item('B1_1', 'Gf', 1.1, -2.0, 2),  // fill  → light-gray trapezoid = opt3
  item('C1_1', 'Gv', 1.1, -2.0, 4),  // dir   → vertical ellipse outline = opt5
  item('D1_1', 'Gf', 1.1, -2.0, 7),  // size  → small outline triangle = opt8
  item('E1_1', 'Gf', 1.1, -2.0, 7),  // count → 3 T-shapes TT/T = opt8

  // ─── Level 2 — easy (b ≈ -1.5) ────────────────────────────────────────────
  item('A2_1', 'Gf', 1.2, -1.5, 4),  // shape/size → small outline rectangle = opt5
  item('B2_1', 'Gf', 1.2, -1.5, 7),  // fill  → light gray square = opt8
  item('C2_1', 'Gv', 1.2, -1.5, 4),  // dir   → upright ellipse = opt5
  item('D2_1', 'Gf', 1.2, -1.5, 6),  // size  → small outline rectangle = opt7
  item('E2_1', 'Gf', 1.2, -1.5, 5),  // count → 4 T-shapes TT/TT = opt6

  // ─── Level 3 — medium (b ≈ -0.5) ──────────────────────────────────────────
  item('A3_1', 'Gf', 1.3, -0.5, 2),  // shape → outline T-shape = opt3
  item('B3_1', 'Gf', 1.3, -0.5, 6),  // fill  → light gray rect = opt7
  item('C3_1', 'Gv', 1.3, -0.5, 6),  // dir   → tilted gray rect = opt7
  item('D3_1', 'Gf', 1.3, -0.5, 0),  // size  → small gray circle = opt1
  item('E3_1', 'Gf', 1.3, -0.5, 7),  // count → 2 outline squares = opt8

  // ─── Level 4 — hard (b ≈ 0.5) ─────────────────────────────────────────────
  item('A4_1', 'Gf', 1.4, 0.5, 1),   // shape → portrait outline rectangle = opt2
  item('B4_1', 'Gf', 1.4, 0.5, 3),   // fill  → dark circle = opt4
  item('C4_1', 'Gv', 1.4, 0.5, 4),   // dir   → outline up-pointing triangle = opt5
  item('D4_1', 'Gf', 1.4, 0.5, 6),   // size  → small dark circle = opt7
  item('E4_1', 'Gf', 1.4, 0.5, 4),   // count → 3 dark ellipses = opt5

  // ─── Level 5 — very hard (b ≈ 1.5) ────────────────────────────────────────
  item('B5_1', 'Gf', 1.5, 1.5, 6),   // fill+size → small black diamond = opt7
  item('C5_1', 'Gv', 1.5, 1.5, 4),   // dir   → T rotated ~135° = opt5
  item('D5_1', 'Gf', 1.5, 1.5, 2),   // size  → smallest dark triangle = opt3
  item('E5_1', 'Gf', 1.5, 1.5, 1),   // count → 5 dots = opt2
  item('A4_2', 'Gf', 1.4, 0.5, 2),   // shape → outline square = opt3
];
