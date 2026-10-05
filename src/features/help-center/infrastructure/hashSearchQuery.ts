/**
 * TEC Ola A §5.4 — hash de búsqueda sin persistir `q` en claro.
 * `q_hash` = primeros 16 hex de SHA-256(normalize(q)); normalize = trim + lower.
 * `q_len` = code units tras trim, máx. 200.
 */

const Q_LEN_MAX = 200;
const Q_HASH_HEX_LEN = 16;

export function normalizeSearchQuery(q: string): string {
  return q.trim().toLowerCase();
}

export function searchQueryLen(q: string): number {
  return Math.min(q.trim().length, Q_LEN_MAX);
}

export async function hashSearchQuery(q: string): Promise<string> {
  const normalized = normalizeSearchQuery(q);
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex.slice(0, Q_HASH_HEX_LEN);
}
