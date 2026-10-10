// Escapes a value for safe interpolation into HTML text or a quoted
// attribute — used by every server-built email that includes anything a
// player or organiser typed (names, pool names, emails, links).
export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
