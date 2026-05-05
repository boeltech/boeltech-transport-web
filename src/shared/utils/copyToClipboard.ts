/**
 * Copia texto al portapapeles (API segura del navegador).
 * @returns true si se escribió correctamente
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;
  try {
    await navigator.clipboard.writeText(trimmed);
    return true;
  } catch {
    return false;
  }
}
