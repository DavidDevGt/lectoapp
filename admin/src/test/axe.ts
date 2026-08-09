import axe, { type AxeResults, type Result } from 'axe-core';
import { expect } from 'vitest';

/**
 * Verificación de accesibilidad sobre lo que realmente se renderiza.
 *
 * Se apoya en la suite de Vitest que ya corre en CI en lugar de montar un
 * segundo pipeline: el objetivo es que ninguna violación seria llegue a main,
 * y eso se consigue igual sin arrastrar un navegador headless al pipeline.
 *
 * Solo falla ante severidad `serious` y `critical`. Las de nivel `minor` y
 * `moderate` se reportan pero no bloquean, para que el gate empiece a servir
 * desde el primer día en vez de quedar desactivado por ruido.
 */

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

function describeViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => `      ${node.html}`).join('\n');
  return `  [${violation.impact}] ${violation.id}: ${violation.help}\n${nodes}\n      ${violation.helpUrl}`;
}

export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results: AxeResults = await axe.run(container, {
    // El contraste se valida sobre los tokens en tokens.test.ts; axe no puede
    // resolver variables CSS en jsdom y daría falsos negativos.
    rules: { 'color-contrast': { enabled: false } },
  });

  const blocking = results.violations.filter(
    (violation) => violation.impact && BLOCKING_IMPACTS.has(violation.impact),
  );

  const message =
    blocking.length > 0
      ? `Violaciones de accesibilidad bloqueantes:\n${blocking.map(describeViolation).join('\n')}`
      : '';

  expect(message, message).toBe('');
}
