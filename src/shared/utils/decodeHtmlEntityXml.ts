import { decode } from "html-entities";

/**
 * Igual que en API: desescapa XML devuelto por PAC/SOAP sin destruir `&amp;`
 * válidos en atributos (RFC / razón social con `&`).
 */
export function decodeHtmlEntityEncodedXml(raw: string): string {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<cfdi")) {
    return raw;
  }
  if (!trimmed.startsWith("&lt;")) {
    return raw;
  }

  let out = raw;
  for (let i = 0; i < 8; i++) {
    const t = out.trimStart();
    if (t.startsWith("<?xml") || t.startsWith("<cfdi")) {
      return out;
    }
    if (!t.startsWith("&lt;")) {
      return out;
    }
    const next = decode(out, { level: "all", scope: "strict" });
    if (next === out) {
      return out;
    }
    out = next;
  }
  return out;
}
