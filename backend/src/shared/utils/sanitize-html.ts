import sanitizeHtml from 'sanitize-html';

/**
 * Elimina cualquier marcado HTML de texto generado por el usuario (título y
 * contenido de lecturas, enunciados/explicaciones de preguntas, texto de
 * opciones). Hoy ningún cliente renderiza HTML enriquecido — admin usa texto
 * plano (React escapa por defecto) — así que la política es despojar TODAS
 * las etiquetas en vez de mantener un allowlist de formato. Si en el futuro
 * se agrega un editor rich-text, esta función debe cambiar a un allowlist
 * explícito (ver ARCHITECTURE.md → Registro de Riesgos R-04).
 */
export function sanitizePlainText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
