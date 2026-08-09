#!/usr/bin/env node
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Presupuesto de tamaño del bundle, aplicado en el build.
 *
 * El panel es una herramienta interna que se usa desde equipos de escritorio,
 * pero en Guatemala eso no garantiza buena conexión. Sin un presupuesto que
 * falle, el peso solo crece: el chunk inicial llegó a 217 KB comprimidos porque
 * Recharts viajaba en todas las rutas, incluida la de login.
 *
 * Los límites son sobre contenido comprimido con gzip, que es lo que viaja por
 * la red. Subirlos es una decisión consciente, no un accidente.
 */

const BUDGETS = {
  /** Todo lo que el navegador necesita antes de pintar la pantalla de login. */
  initialJsGzipKb: 120,
  /** Suma de todo el JavaScript del panel, cargado o no. */
  totalJsGzipKb: 320,
  /** Hoja de estilos completa. */
  totalCssGzipKb: 15,
};

const DIST = join(process.cwd(), 'dist');
const ASSETS = join(DIST, 'assets');

if (!existsSync(ASSETS)) {
  console.error('No existe dist/assets. Ejecuta `pnpm build` antes de `pnpm size`.');
  process.exit(1);
}

const gzipKb = (path) => gzipSync(readFileSync(path)).length / 1024;

const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8');
const files = readdirSync(ASSETS);

/*
 * El chunk inicial es el que index.html carga con <script type="module">, más
 * todo lo que precarga con <link rel="modulepreload">. Lo demás llega bajo
 * demanda al navegar.
 */
const eagerlyLoaded = new Set(
  [...indexHtml.matchAll(/(?:src|href)="\/assets\/([^"]+)"/g)].map((match) => match[1]),
);

let initialJs = 0;
let totalJs = 0;
let totalCss = 0;

for (const file of files) {
  const size = gzipKb(join(ASSETS, file));
  if (file.endsWith('.js')) {
    totalJs += size;
    if (eagerlyLoaded.has(file)) initialJs += size;
  } else if (file.endsWith('.css')) {
    totalCss += size;
  }
}

const checks = [
  ['JS inicial', initialJs, BUDGETS.initialJsGzipKb],
  ['JS total', totalJs, BUDGETS.totalJsGzipKb],
  ['CSS total', totalCss, BUDGETS.totalCssGzipKb],
];

let failed = false;
console.log('Presupuesto de bundle (gzip)\n');
for (const [label, actual, budget] of checks) {
  const ok = actual <= budget;
  if (!ok) failed = true;
  const pct = Math.round((actual / budget) * 100);
  console.log(
    `  ${ok ? 'OK  ' : 'EXCEDE'}  ${label.padEnd(12)} ${actual.toFixed(1).padStart(7)} KB / ${String(budget).padStart(3)} KB  (${pct}%)`,
  );
}

if (failed) {
  console.error(
    '\nEl bundle supera el presupuesto. Reduce el peso o sube el límite en scripts/check-bundle-size.mjs de forma explícita.',
  );
  process.exit(1);
}

console.log('\nDentro del presupuesto.');
