/**
 * Fuente única de verdad de los tokens de diseño de LectoApp.
 *
 * Existe en TypeScript además de en CSS porque Recharts recibe los colores como
 * props de JavaScript y no puede leer variables CSS. `tokens.css` es el espejo
 * de este archivo, y `tokens.test.ts` falla si los dos se desincronizan.
 *
 * ── Reglas de la paleta ──────────────────────────────────────────────────────
 *
 * 1. Cada color semántico es una TERNA, no un valor suelto:
 *      -bg     fondo tintado suave, para badges y chips
 *      -fg     texto o borde sobre ese fondo (y legible también sobre blanco)
 *      -solid  relleno saturado, para barras de gráfica y botones
 *    Verificado: todas las parejas -fg sobre -bg y -fg sobre blanco superan
 *    WCAG AA para texto normal (>= 4.5:1).
 *
 * 2. Un eje semántico = una familia cromática. No se reutilizan tonos entre ejes:
 *      · Nivel de comprensión  → rampa ordenada cielo → índigo → fucsia
 *        (es una progresión cognitiva: literal, inferencial, crítico)
 *      · Nivel de progresión   → rampa de logro, solo en gráficas
 *      · Estado de flujo       → verde (aprobado), ámbar (pendiente/IA), rojo (destructivo)
 *      · Estado de lectura     → neutros; "archivada" NO es roja, porque archivar
 *        no es destructivo y el rojo queda reservado para eliminar
 *
 * 3. Dos `-solid` solo alcanzan AA para texto grande y componentes de UI
 *    (`--color-literal-solid` 4.10:1 y `--color-success-solid` 3.30:1 contra
 *    blanco). Se usan como relleno de gráfica y borde de badge, nunca como
 *    fondo de texto pequeño en blanco.
 */

export const tokens = {
  // ── Neutros (fríos, con sesgo hacia el azul de marca) ──────────────────────
  '--color-neutral-50': '#F8FAFC',
  '--color-neutral-100': '#F1F5F9',
  '--color-neutral-200': '#E2E8F0',
  '--color-neutral-300': '#CBD5E1',
  '--color-neutral-400': '#94A3B8',
  '--color-neutral-500': '#64748B',
  '--color-neutral-600': '#475569',
  '--color-neutral-700': '#334155',
  '--color-neutral-800': '#1E293B',
  '--color-neutral-900': '#0F172A',

  // ── Superficies ────────────────────────────────────────────────────────────
  '--color-bg-app': '#F8FAFC',
  '--color-bg-surface': '#FFFFFF',
  '--color-bg-sunken': '#F1F5F9',
  '--color-bg-overlay': 'rgba(15, 23, 42, 0.45)',
  '--color-border': '#E2E8F0',
  '--color-border-strong': '#CBD5E1',

  // ── Texto ──────────────────────────────────────────────────────────────────
  '--color-text-primary': '#0F172A',
  '--color-text-secondary': '#475569',
  '--color-text-muted': '#64748B',
  '--color-text-on-brand': '#FFFFFF',
  '--color-text-on-dark': '#F8FAFC',

  // ── Marca ──────────────────────────────────────────────────────────────────
  // #0072CE es el único de los dos azules propuestos que supera AA sobre blanco.
  '--color-brand-bg': '#E6F1FA',
  '--color-brand-fg': '#005CA8',
  '--color-brand-solid': '#0072CE',
  '--color-brand-solid-hover': '#005CA8',
  '--color-sidebar-bg': '#0F172A',
  '--color-sidebar-active': '#1E293B',
  '--color-focus-ring': '#0072CE',

  // ── Nivel de comprensión (rampa ordenada) ──────────────────────────────────
  '--color-literal-bg': '#E0F2FE',
  '--color-literal-fg': '#075985',
  '--color-literal-solid': '#0284C7',
  '--color-inferential-bg': '#E0E7FF',
  '--color-inferential-fg': '#3730A3',
  '--color-inferential-solid': '#4F46E5',
  '--color-critical-bg': '#FAE8FF',
  '--color-critical-fg': '#701A75',
  '--color-critical-solid': '#A21CAF',

  // ── Estado de flujo editorial ──────────────────────────────────────────────
  '--color-success-bg': '#DCFCE7',
  '--color-success-fg': '#166534',
  '--color-success-solid': '#16A34A',
  '--color-pending-bg': '#FEF3C7',
  '--color-pending-bg-hover': '#FDE68A',
  '--color-pending-fg': '#854D0E',
  '--color-pending-solid': '#B45309',
  '--color-danger-bg': '#FEE2E2',
  '--color-danger-fg': '#991B1B',
  '--color-danger-solid': '#DC2626',
  '--color-danger-solid-hover': '#B91C1C',

  // ── Estado de lectura ──────────────────────────────────────────────────────
  '--color-status-draft-bg': '#F1F5F9',
  '--color-status-draft-fg': '#475569',
  '--color-status-archived-bg': '#E7E5E4',
  '--color-status-archived-fg': '#57534E',

  // ── Nivel de progresión del estudiante (solo gráficas) ─────────────────────
  '--color-level-beginner': '#64748B',
  '--color-level-intermediate': '#0F766E',
  '--color-level-advanced': '#1D4ED8',
  '--color-level-expert': '#7E22CE',
  '--color-level-supreme': '#B45309',

  // ── Radios ─────────────────────────────────────────────────────────────────
  '--radius-sm': '4px',
  '--radius-md': '6px',
  '--radius-lg': '8px',
  '--radius-xl': '12px',

  // ── Sombras ────────────────────────────────────────────────────────────────
  '--shadow-sm': '0 1px 2px rgba(15, 23, 42, 0.06)',
  '--shadow-md': '0 4px 12px rgba(15, 23, 42, 0.08)',
  '--shadow-lg': '0 12px 32px rgba(15, 23, 42, 0.16)',

  // ── Espaciado ──────────────────────────────────────────────────────────────
  '--space-1': '4px',
  '--space-2': '8px',
  '--space-3': '12px',
  '--space-4': '16px',
  '--space-5': '24px',
  '--space-6': '32px',
} as const;

export type TokenName = keyof typeof tokens;

/** Devuelve el valor literal de un token, para pasarlo a librerías que no leen CSS. */
export function token(name: TokenName): string {
  return tokens[name];
}

/**
 * Colores para Recharts, que necesita literales de JavaScript.
 * Se derivan de `tokens`, así que no pueden divergir de lo que ve el CSS.
 */
export const chartColors = {
  comprehension: {
    LITERAL: tokens['--color-literal-solid'],
    INFERENTIAL: tokens['--color-inferential-solid'],
    CRITICAL: tokens['--color-critical-solid'],
  },
  progression: {
    BEGINNER: tokens['--color-level-beginner'],
    INTERMEDIATE: tokens['--color-level-intermediate'],
    ADVANCED: tokens['--color-level-advanced'],
    EXPERT: tokens['--color-level-expert'],
    SUPREME: tokens['--color-level-supreme'],
  },
  readingStatus: {
    DRAFT: tokens['--color-neutral-500'],
    PUBLISHED: tokens['--color-success-solid'],
    ARCHIVED: tokens['--color-level-beginner'],
  },
  questionStatus: {
    DRAFT: tokens['--color-pending-solid'],
    APPROVED: tokens['--color-success-solid'],
  },
  accent: tokens['--color-brand-solid'],
  axis: tokens['--color-neutral-400'],
  grid: tokens['--color-border'],
} as const;
