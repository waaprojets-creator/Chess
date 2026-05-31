import type { CognitiveItem, MatrixCell } from '@/types/chess';

// Shorthand helpers
const c = (size: MatrixCell['size'], fill: MatrixCell['fill'], rot?: MatrixCell['rotation'], count?: MatrixCell['count']): MatrixCell =>
  ({ shape: 'circle',   size, fill, ...(rot ? { rotation: rot } : {}), ...(count ? { count } : {}) });
const s = (size: MatrixCell['size'], fill: MatrixCell['fill'], rot?: MatrixCell['rotation'], count?: MatrixCell['count']): MatrixCell =>
  ({ shape: 'square',   size, fill, ...(rot ? { rotation: rot } : {}), ...(count ? { count } : {}) });
const t = (size: MatrixCell['size'], fill: MatrixCell['fill'], rot?: MatrixCell['rotation'], count?: MatrixCell['count']): MatrixCell =>
  ({ shape: 'triangle', size, fill, ...(rot ? { rotation: rot } : {}), ...(count ? { count } : {}) });
const d = (size: MatrixCell['size'], fill: MatrixCell['fill'], rot?: MatrixCell['rotation'], count?: MatrixCell['count']): MatrixCell =>
  ({ shape: 'diamond',  size, fill, ...(rot ? { rotation: rot } : {}), ...(count ? { count } : {}) });

// ─── EASY (b ≈ −1.8 to −0.6) ───────────────────────────────────────────────

const ITEM_01: CognitiveItem = {
  id: 'cog_01', domain: 'Gf', irt: { a: 1.1, b: -1.8, c: 0.2 },
  // Rule: shape changes per row (circle→square→triangle), same fill+size
  grid: [
    [c('md','solid'), c('md','solid'), c('md','solid')],
    [s('md','solid'), s('md','solid'), s('md','solid')],
    [t('md','solid'), t('md','solid'), null],
  ],
  options: [t('md','solid'), c('md','solid'), s('md','solid'), d('md','solid'), t('md','outline')],
  correctIndex: 0,
};

const ITEM_02: CognitiveItem = {
  id: 'cog_02', domain: 'Gf', irt: { a: 1.2, b: -1.6, c: 0.2 },
  // Rule: size progresses left→right (sm→md→lg), same shape+fill
  grid: [
    [s('sm','solid'), s('md','solid'), s('lg','solid')],
    [s('sm','solid'), s('md','solid'), s('lg','solid')],
    [s('sm','solid'), s('md','solid'), null],
  ],
  options: [s('lg','solid'), s('sm','solid'), s('md','solid'), c('lg','solid'), t('lg','solid')],
  correctIndex: 0,
};

const ITEM_03: CognitiveItem = {
  id: 'cog_03', domain: 'Gf', irt: { a: 1.0, b: -1.4, c: 0.2 },
  // Rule: fill changes per column (solid→outline→striped), all circles
  grid: [
    [c('md','solid'), c('md','outline'), c('md','striped')],
    [c('md','solid'), c('md','outline'), c('md','striped')],
    [c('md','solid'), c('md','outline'), null],
  ],
  options: [c('md','striped'), c('md','solid'), c('md','outline'), s('md','striped'), t('md','striped')],
  correctIndex: 0,
};

const ITEM_04: CognitiveItem = {
  id: 'cog_04', domain: 'Gv', irt: { a: 1.1, b: -1.2, c: 0.2 },
  // Rule: rotation progresses per column (0°→90°→180°), all triangles solid md
  grid: [
    [t('md','solid',0),   t('md','solid',90),  t('md','solid',180)],
    [t('md','solid',0),   t('md','solid',90),  t('md','solid',180)],
    [t('md','solid',0),   t('md','solid',90),  null],
  ],
  options: [t('md','solid',180), t('md','solid',0), t('md','solid',90), c('md','solid'), s('md','solid')],
  correctIndex: 0,
};

const ITEM_05: CognitiveItem = {
  id: 'cog_05', domain: 'Gf', irt: { a: 1.0, b: -1.0, c: 0.2 },
  // Rule: count progresses per column (1→2→3), all circles outline md
  grid: [
    [c('md','outline',undefined,1), c('md','outline',undefined,2), c('md','outline',undefined,3)],
    [c('md','outline',undefined,1), c('md','outline',undefined,2), c('md','outline',undefined,3)],
    [c('md','outline',undefined,1), c('md','outline',undefined,2), null],
  ],
  options: [
    c('md','outline',undefined,3),
    c('md','outline',undefined,1),
    c('md','outline',undefined,2),
    s('md','outline',undefined,3),
    c('md','solid',undefined,3),
  ],
  correctIndex: 0,
};

const ITEM_06: CognitiveItem = {
  id: 'cog_06', domain: 'Gf', irt: { a: 1.2, b: -0.8, c: 0.2 },
  // Rule: shape changes per column (circle→square→triangle), all md solid
  grid: [
    [c('md','solid'), s('md','solid'), t('md','solid')],
    [c('md','solid'), s('md','solid'), t('md','solid')],
    [c('md','solid'), s('md','solid'), null],
  ],
  options: [t('md','solid'), c('md','solid'), s('md','solid'), d('md','solid'), t('md','outline')],
  correctIndex: 0,
};

const ITEM_07: CognitiveItem = {
  id: 'cog_07', domain: 'Gf', irt: { a: 1.1, b: -0.6, c: 0.2 },
  // Rule: fill changes per row (solid→outline→striped), all squares md
  grid: [
    [s('md','solid'),   s('md','solid'),   s('md','solid')],
    [s('md','outline'), s('md','outline'), s('md','outline')],
    [s('md','striped'), s('md','striped'), null],
  ],
  options: [s('md','striped'), s('md','solid'), s('md','outline'), c('md','striped'), d('md','striped')],
  correctIndex: 0,
};

// ─── MEDIUM (b ≈ −0.5 to +0.5) ──────────────────────────────────────────────

const ITEM_08: CognitiveItem = {
  id: 'cog_08', domain: 'Gf', irt: { a: 1.3, b: -0.4, c: 0.2 },
  // Rules: shape per row (circle/square/triangle) AND size per column (sm/md/lg)
  grid: [
    [c('sm','solid'), c('md','solid'), c('lg','solid')],
    [s('sm','solid'), s('md','solid'), s('lg','solid')],
    [t('sm','solid'), t('md','solid'), null],
  ],
  options: [t('lg','solid'), t('sm','solid'), t('md','solid'), c('lg','solid'), s('lg','solid')],
  correctIndex: 0,
};

const ITEM_09: CognitiveItem = {
  id: 'cog_09', domain: 'Gf', irt: { a: 1.2, b: -0.3, c: 0.2 },
  // Rules: fill per row (solid/outline/striped) AND shape per column (circle/square/triangle)
  grid: [
    [c('md','solid'),   s('md','solid'),   t('md','solid')],
    [c('md','outline'), s('md','outline'), t('md','outline')],
    [c('md','striped'), s('md','striped'), null],
  ],
  options: [t('md','striped'), t('md','solid'), t('md','outline'), c('md','striped'), d('md','striped')],
  correctIndex: 0,
};

const ITEM_10: CognitiveItem = {
  id: 'cog_10', domain: 'Gv', irt: { a: 1.3, b: -0.1, c: 0.2 },
  // Rules: rotation per row (0°/90°/180°) AND size per column (sm/md/lg), all triangles solid
  grid: [
    [t('sm','solid',0),   t('md','solid',0),   t('lg','solid',0)],
    [t('sm','solid',90),  t('md','solid',90),  t('lg','solid',90)],
    [t('sm','solid',180), t('md','solid',180), null],
  ],
  options: [t('lg','solid',180), t('sm','solid',180), t('md','solid',180), c('lg','solid'), t('lg','solid',90)],
  correctIndex: 0,
};

const ITEM_11: CognitiveItem = {
  id: 'cog_11', domain: 'Gf', irt: { a: 1.4, b: 0.0, c: 0.2 },
  // Rules: shape per row (circle/square/diamond) AND fill per column (solid/outline/striped), md
  grid: [
    [c('md','solid'),   c('md','outline'), c('md','striped')],
    [s('md','solid'),   s('md','outline'), s('md','striped')],
    [d('md','solid'),   d('md','outline'), null],
  ],
  options: [d('md','striped'), d('md','solid'), d('md','outline'), s('md','striped'), c('md','striped')],
  correctIndex: 0,
};

const ITEM_12: CognitiveItem = {
  id: 'cog_12', domain: 'Gf', irt: { a: 1.3, b: 0.1, c: 0.2 },
  // Rules: count per row (1/2/3) AND shape per column (circle/square/triangle)
  grid: [
    [c('md','solid',undefined,1), s('md','solid',undefined,1), t('md','solid',undefined,1)],
    [c('md','solid',undefined,2), s('md','solid',undefined,2), t('md','solid',undefined,2)],
    [c('md','solid',undefined,3), s('md','solid',undefined,3), null],
  ],
  options: [
    t('md','solid',undefined,3),
    t('md','solid',undefined,1),
    t('md','solid',undefined,2),
    c('md','solid',undefined,3),
    s('md','solid',undefined,3),
  ],
  correctIndex: 0,
};

const ITEM_13: CognitiveItem = {
  id: 'cog_13', domain: 'Gf', irt: { a: 1.4, b: 0.2, c: 0.2 },
  // Rules: fill per row (solid/outline/striped) AND size per column (sm/md/lg), all diamonds
  grid: [
    [d('sm','solid'),   d('md','solid'),   d('lg','solid')],
    [d('sm','outline'), d('md','outline'), d('lg','outline')],
    [d('sm','striped'), d('md','striped'), null],
  ],
  options: [d('lg','striped'), d('sm','striped'), d('md','striped'), c('lg','striped'), d('lg','outline')],
  correctIndex: 0,
};

const ITEM_14: CognitiveItem = {
  id: 'cog_14', domain: 'Gf', irt: { a: 1.3, b: 0.3, c: 0.2 },
  // Rules: shape per row AND size decreases right→left (lg/md/sm), all solid
  grid: [
    [c('lg','solid'), c('md','solid'), c('sm','solid')],
    [s('lg','solid'), s('md','solid'), s('sm','solid')],
    [t('lg','solid'), t('md','solid'), null],
  ],
  options: [t('sm','solid'), t('md','solid'), t('lg','solid'), c('sm','solid'), s('sm','solid')],
  correctIndex: 0,
};

const ITEM_15: CognitiveItem = {
  id: 'cog_15', domain: 'Gf', irt: { a: 1.4, b: 0.3, c: 0.2 },
  // Rules: count per column (1/2/3) AND fill per row (solid/outline/striped), all circles md
  grid: [
    [c('md','solid',undefined,1),   c('md','solid',undefined,2),   c('md','solid',undefined,3)],
    [c('md','outline',undefined,1), c('md','outline',undefined,2), c('md','outline',undefined,3)],
    [c('md','striped',undefined,1), c('md','striped',undefined,2), null],
  ],
  options: [
    c('md','striped',undefined,3),
    c('md','striped',undefined,2),
    c('md','striped',undefined,1),
    s('md','striped',undefined,3),
    c('md','outline',undefined,3),
  ],
  correctIndex: 0,
};

const ITEM_16: CognitiveItem = {
  id: 'cog_16', domain: 'Gf', irt: { a: 1.5, b: 0.4, c: 0.2 },
  // Rules: fill per column (solid/outline/striped) AND count per row (1/2/3), all squares md
  grid: [
    [s('md','solid',undefined,1), s('md','outline',undefined,1), s('md','striped',undefined,1)],
    [s('md','solid',undefined,2), s('md','outline',undefined,2), s('md','striped',undefined,2)],
    [s('md','solid',undefined,3), s('md','outline',undefined,3), null],
  ],
  options: [
    s('md','striped',undefined,3),
    s('md','striped',undefined,1),
    s('md','solid',undefined,3),
    c('md','striped',undefined,3),
    s('md','striped',undefined,2),
  ],
  correctIndex: 0,
};

const ITEM_17: CognitiveItem = {
  id: 'cog_17', domain: 'Gf', irt: { a: 1.5, b: 0.4, c: 0.2 },
  // Rules: fill per row AND size per column, all triangles
  grid: [
    [t('sm','solid'),   t('md','solid'),   t('lg','solid')],
    [t('sm','outline'), t('md','outline'), t('lg','outline')],
    [t('sm','striped'), t('md','striped'), null],
  ],
  options: [t('lg','striped'), t('sm','striped'), t('md','striped'), c('lg','striped'), t('lg','solid')],
  correctIndex: 0,
};

const ITEM_18: CognitiveItem = {
  id: 'cog_18', domain: 'Gf', irt: { a: 1.5, b: 0.5, c: 0.2 },
  // Rules: shape per column (circle/square/diamond) AND count per row (1/2/3), all solid md
  grid: [
    [c('md','solid',undefined,1), s('md','solid',undefined,1), d('md','solid',undefined,1)],
    [c('md','solid',undefined,2), s('md','solid',undefined,2), d('md','solid',undefined,2)],
    [c('md','solid',undefined,3), s('md','solid',undefined,3), null],
  ],
  options: [
    d('md','solid',undefined,3),
    d('md','solid',undefined,1),
    c('md','solid',undefined,3),
    s('md','solid',undefined,3),
    d('md','solid',undefined,2),
  ],
  correctIndex: 0,
};

// ─── HARD (b ≈ +0.6 to +2.0) ────────────────────────────────────────────────

const ITEM_19: CognitiveItem = {
  id: 'cog_19', domain: 'Gf', irt: { a: 1.5, b: 0.8, c: 0.2 },
  // Latin square: each row & col has all 3 sizes, fill per row, all circles solid
  // R1: sm,md,lg (solid) · R2: md,lg,sm (outline) · R3: lg,sm,?(=md) (striped)
  grid: [
    [c('sm','solid'),   c('md','solid'),   c('lg','solid')],
    [c('md','outline'), c('lg','outline'), c('sm','outline')],
    [c('lg','striped'), c('sm','striped'), null],
  ],
  options: [c('md','striped'), c('sm','striped'), c('lg','striped'), c('md','solid'), s('md','striped')],
  correctIndex: 0,
};

const ITEM_20: CognitiveItem = {
  id: 'cog_20', domain: 'Gf', irt: { a: 1.6, b: 0.9, c: 0.2 },
  // Latin square shapes: each row & col has all 3 shapes, all md solid
  // R1: C,S,T · R2: T,C,S · R3: S,T,?(=C)
  grid: [
    [c('md','solid'), s('md','solid'), t('md','solid')],
    [t('md','solid'), c('md','solid'), s('md','solid')],
    [s('md','solid'), t('md','solid'), null],
  ],
  options: [c('md','solid'), s('md','solid'), t('md','solid'), d('md','solid'), c('md','outline')],
  correctIndex: 0,
};

const ITEM_21: CognitiveItem = {
  id: 'cog_21', domain: 'Gf', irt: { a: 1.6, b: 1.0, c: 0.2 },
  // Latin square counts (1/2/3) AND latin square sizes (sm/md/lg), all circles solid
  // R1: (1,sm),(2,md),(3,lg) · R2: (3,md),(1,lg),(2,sm) · R3: (2,lg),(3,sm),(?,?)=(1,md)
  grid: [
    [c('sm','solid',undefined,1), c('md','solid',undefined,2), c('lg','solid',undefined,3)],
    [c('md','solid',undefined,3), c('lg','solid',undefined,1), c('sm','solid',undefined,2)],
    [c('lg','solid',undefined,2), c('sm','solid',undefined,3), null],
  ],
  options: [
    c('md','solid',undefined,1),
    c('md','solid',undefined,2),
    c('md','solid',undefined,3),
    c('sm','solid',undefined,1),
    c('lg','solid',undefined,1),
  ],
  correctIndex: 0,
};

const ITEM_22: CognitiveItem = {
  id: 'cog_22', domain: 'Gf', irt: { a: 1.7, b: 1.2, c: 0.2 },
  // 3 rules: shape+size per row, fill per column
  // R1: circles sm · R2: squares md · R3: triangles lg
  // Col1: solid · Col2: outline · Col3: striped
  grid: [
    [c('sm','solid'),  c('sm','outline'), c('sm','striped')],
    [s('md','solid'),  s('md','outline'), s('md','striped')],
    [t('lg','solid'),  t('lg','outline'), null],
  ],
  options: [
    t('lg','striped'),
    t('sm','striped'),
    t('lg','solid'),
    c('lg','striped'),
    s('lg','striped'),
  ],
  correctIndex: 0,
};

const ITEM_23: CognitiveItem = {
  id: 'cog_23', domain: 'Gf', irt: { a: 1.7, b: 1.4, c: 0.2 },
  // Count per row (1/2/3) AND size per column (sm/md/lg), all squares solid
  // [2][2] = square, count=3, lg
  grid: [
    [s('sm','solid',undefined,1), s('md','solid',undefined,1), s('lg','solid',undefined,1)],
    [s('sm','solid',undefined,2), s('md','solid',undefined,2), s('lg','solid',undefined,2)],
    [s('sm','solid',undefined,3), s('md','solid',undefined,3), null],
  ],
  options: [
    s('lg','solid',undefined,3),
    s('md','solid',undefined,3),
    s('lg','solid',undefined,2),
    c('lg','solid',undefined,3),
    s('lg','outline',undefined,3),
  ],
  correctIndex: 0,
};

const ITEM_24: CognitiveItem = {
  id: 'cog_24', domain: 'Gf', irt: { a: 1.8, b: 1.6, c: 0.2 },
  // Latin square shapes AND latin square fills, all md
  // R1: (C,solid),(S,outline),(T,striped) · R2: (T,outline),(C,striped),(S,solid) · R3: (S,striped),(T,solid),(?,?)=(C,outline)
  grid: [
    [c('md','solid'),   s('md','outline'), t('md','striped')],
    [t('md','outline'), c('md','striped'), s('md','solid')],
    [s('md','striped'), t('md','solid'),   null],
  ],
  options: [
    c('md','outline'),
    c('md','solid'),
    s('md','outline'),
    t('md','outline'),
    c('md','striped'),
  ],
  correctIndex: 0,
};

const ITEM_25: CognitiveItem = {
  id: 'cog_25', domain: 'Gf', irt: { a: 1.8, b: 2.0, c: 0.2 },
  // Latin square shapes + latin square sizes + latin square fills (all three)
  // R1: (C,sm,solid),(S,md,outline),(T,lg,striped)
  // R2: (T,md,outline),(C,lg,striped),(S,sm,solid)
  // R3: (S,lg,striped),(T,sm,solid),(?,?,?)=(C,md,outline)
  grid: [
    [c('sm','solid'),   s('md','outline'), t('lg','striped')],
    [t('md','outline'), c('lg','striped'), s('sm','solid')],
    [s('lg','striped'), t('sm','solid'),   null],
  ],
  options: [
    c('md','outline'),
    c('sm','outline'),
    c('md','solid'),
    s('md','outline'),
    c('lg','outline'),
  ],
  correctIndex: 0,
};

export const COGNITIVE_ITEMS: CognitiveItem[] = [
  ITEM_01, ITEM_02, ITEM_03, ITEM_04, ITEM_05,
  ITEM_06, ITEM_07, ITEM_08, ITEM_09, ITEM_10,
  ITEM_11, ITEM_12, ITEM_13, ITEM_14, ITEM_15,
  ITEM_16, ITEM_17, ITEM_18, ITEM_19, ITEM_20,
  ITEM_21, ITEM_22, ITEM_23, ITEM_24, ITEM_25,
];
