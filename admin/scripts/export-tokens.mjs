#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Exporta la paleta a formatos que puedan consumir otras plataformas.
 *
 * La app móvil (Flutter, Sprint 4) tiene que nacer con exactamente los mismos
 * colores que el panel. Copiarlos a mano garantizaría que diverjan en la primera
 * corrección, así que se generan desde tokens.css, el mismo archivo que ya está
 * sincronizado con tokens.ts por tokens.test.ts.
 *
 * Genera:
 *   contracts/design-tokens.json  formato DTCG, consumible por Figma/Tokens Studio
 *   contracts/design_tokens.dart  clase Dart lista para el tema de Flutter
 *
 * Uso: pnpm tokens:export
 */

const ROOT = resolve(process.cwd(), '..');
const CSS = resolve(process.cwd(), 'src/styles/tokens.css');
const JSON_OUT = resolve(ROOT, 'contracts/design-tokens.json');
const DART_OUT = resolve(ROOT, 'contracts/design_tokens.dart');

const css = readFileSync(CSS, 'utf-8');
const tokens = {};
for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
  tokens[match[1]] = match[2].trim();
}

const isColor = (name) => name.startsWith('--color-');

/* ── DTCG JSON ─────────────────────────────────────────────────────────────── */

const dtcg = { $description: 'Tokens de diseño de LectoApp. Generado por admin/scripts/export-tokens.mjs — no editar a mano.' };
for (const [name, value] of Object.entries(tokens)) {
  const [, group, ...rest] = name.split('-');
  const key = rest.join('-') || group;
  dtcg[group] ??= {};
  dtcg[group][key] = {
    $value: value,
    $type: isColor(name) ? 'color' : group === 'space' || group === 'radius' ? 'dimension' : 'shadow',
  };
}
mkdirSync(dirname(JSON_OUT), { recursive: true });
writeFileSync(JSON_OUT, `${JSON.stringify(dtcg, null, 2)}\n`);

/* ── Dart ──────────────────────────────────────────────────────────────────── */

function toDartName(cssName) {
  return cssName
    .replace(/^--/, '')
    .split('-')
    .map((part, index) => (index === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join('');
}

function toDartColor(value) {
  const hex = value.replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(hex)) return `Color(0xFF${hex.toUpperCase()})`;

  const rgba = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (rgba) {
    const [, r, g, b, a = '1'] = rgba;
    const alpha = Math.round(parseFloat(a) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
    const channel = (c) => Number(c).toString(16).padStart(2, '0').toUpperCase();
    return `Color(0x${alpha}${channel(r)}${channel(g)}${channel(b)})`;
  }
  return null;
}

const colorLines = [];
for (const [name, value] of Object.entries(tokens)) {
  if (!isColor(name)) continue;
  const dartColor = toDartColor(value);
  if (dartColor) colorLines.push(`  static const ${toDartName(name)} = ${dartColor};`);
}

const dimensionLines = [];
for (const [name, value] of Object.entries(tokens)) {
  if (!name.startsWith('--space-') && !name.startsWith('--radius-')) continue;
  const px = parseFloat(value);
  if (!Number.isNaN(px)) dimensionLines.push(`  static const ${toDartName(name)} = ${px.toFixed(1)};`);
}

const dart = `// GENERADO — no editar a mano.
// Fuente: admin/src/styles/tokens.css · Regenerar con: cd admin && pnpm tokens:export
//
// Copiar a mobile/lib/core/theme/ al iniciar el Sprint 4.

import 'package:flutter/material.dart';

/// Paleta compartida entre el panel de administración y la app del estudiante.
class LectoColors {
${colorLines.join('\n')}
}

/// Espaciados y radios compartidos, en unidades lógicas.
class LectoDimens {
${dimensionLines.join('\n')}
}
`;

writeFileSync(DART_OUT, dart);

console.log(`Tokens exportados:
  ${JSON_OUT}   (${Object.keys(tokens).length} tokens, formato DTCG)
  ${DART_OUT}   (${colorLines.length} colores, ${dimensionLines.length} dimensiones)`);
