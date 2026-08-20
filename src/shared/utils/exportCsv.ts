/** Prefijo BOM para que Excel (Windows) interprete el archivo como UTF-8. */
const UTF8_BOM = "\uFEFF";

/** Prefijos que Excel/LibreOffice interpretan como fórmula (CSV injection). */
const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Neutraliza celdas que Excel trataría como fórmula (OWASP CSV Injection).
 * Prefija con `'` para forzar interpretación como texto.
 */
function neutralizeCsvFormula(value: string): string {
  if (value.length > 0 && CSV_FORMULA_PREFIX.test(value[0]!)) {
    return `'${value}`;
  }
  return value;
}

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function formatCell(cell: string | number | null | undefined): string {
  if (cell == null) {
    return escapeCell("");
  }
  if (typeof cell === "number") {
    // Números tipados: no prefijar (preservar saldos negativos como -1500).
    return escapeCell(String(cell));
  }
  return escapeCell(neutralizeCsvFormula(cell));
}

export function buildCsvContent(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const csvRows = [
    headers.map((h) => formatCell(h)).join(","),
    ...rows.map((row) => row.map(formatCell).join(",")),
  ];

  return `${UTF8_BOM}${csvRows.join("\n")}`;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): void {
  const blob = new Blob([buildCsvContent(headers, rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
