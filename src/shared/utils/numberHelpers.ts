// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function toNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? null : num;
}

export function toNumberOrDefault(
  value: string | number | null | undefined,
  defaultValue: number = 0,
): number {
  const num = toNumber(value);
  return num ?? defaultValue;
}
