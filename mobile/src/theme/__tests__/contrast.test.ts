import { colors } from '../colors';

/**
 * Contraste WCAG 2.2 AA sobre los pares que la app usa de verdad.
 *
 * Existe porque la paleta ya había derivado a tonos ilegibles (placeholders a 2.34:1,
 * badge "Supremo" a 2.86:1). Si alguien vuelve a aclarar un token, esto falla aquí y
 * no en el teléfono de un estudiante.
 */

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const AA_NORMAL = 4.5;
const AA_LARGE = 3;

describe('contraste de la paleta', () => {
  const normalTextPairs: [string, string, string][] = [
    ['texto principal sobre superficie', colors.textPrimary, colors.bgSurface],
    ['texto secundario sobre superficie', colors.textSecondary, colors.bgSurface],
    ['texto atenuado sobre superficie', colors.textMuted, colors.bgSurface],
    ['texto atenuado sobre fondo hundido', colors.textMuted, colors.bgSunken],
    ['texto atenuado sobre fondo de app', colors.textMuted, colors.bgApp],
    ['placeholder sobre fondo hundido', colors.textSubtle, colors.bgSunken],
    ['texto sobre color de marca', colors.textOnBrand, colors.brandPrimary],
    ['subtítulo sobre color de marca', colors.textOnBrandMuted, colors.brandPrimary],
    ['marca sobre superficie', colors.brandPrimary, colors.bgSurface],
    ['marca oscura sobre fondo de marca', colors.brandFg, colors.brandBg],
    ['error sobre fondo de error', colors.dangerFg, colors.dangerBg],
    ['puntos sobre fondo dorado', colors.goldFg, colors.goldBg],
    ['racha sobre fondo de racha', colors.streakFg, colors.streakBg],
  ];

  it.each(normalTextPairs)('%s cumple AA para texto normal', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  const badgePairs: [string, string, string][] = [
    ['badge Literal', colors.literalFg, colors.literalBg],
    ['badge Inferencial', colors.inferentialFg, colors.inferentialBg],
    ['badge Crítico', colors.criticalFg, colors.criticalBg],
    ['badge Principiante', colors.beginner, colors.bgSunken],
    ['badge Intermedio', colors.intermediate, colors.literalBg],
    ['badge Avanzado', colors.advanced, colors.inferentialBg],
    ['badge Experto', colors.expert, colors.criticalBg],
    ['badge Supremo', colors.supreme, colors.pendingBg],
  ];

  it.each(badgePairs)('%s cumple AA para texto normal', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  const largeTextPairs: [string, string, string][] = [
    ['puntaje aprobado (40pt)', colors.successFg, colors.bgSunken],
    ['puntaje reprobado (40pt)', colors.pendingFg, colors.bgSunken],
  ];

  it.each(largeTextPairs)('%s cumple AA para texto grande', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
