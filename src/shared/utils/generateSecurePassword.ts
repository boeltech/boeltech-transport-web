/**
 * Genera una contraseña aleatoria que cumple reglas típicas
 * (mayúscula, minúscula, dígito; longitud configurable).
 * Usa `crypto.getRandomValues` (no `Math.random`).
 */
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*-_=+";
const ALPHANUM = UPPER + LOWER + DIGITS;

function randomIndex(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

function pickChar(pool: string): string {
  return pool[randomIndex(pool.length)]!;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/**
 * @param length Longitud final (mínimo 8 para alinearse con validaciones habituales)
 */
export function generateSecurePassword(length = 16): string {
  const len = Math.max(8, Math.min(length, 128));
  const chars: string[] = [
    pickChar(UPPER),
    pickChar(LOWER),
    pickChar(DIGITS),
    pickChar(SYMBOLS),
  ];
  for (let i = chars.length; i < len; i++) {
    chars.push(pickChar(ALPHANUM + SYMBOLS));
  }
  shuffleInPlace(chars);
  return chars.join("");
}
