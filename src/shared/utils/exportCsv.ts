/** Prefijo BOM para que Excel (Windows) interprete el archivo como UTF-8. */
const UTF8_BOM = "\uFEFF";

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function buildCsvContent(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const csvRows = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) =>
      row
        .map((cell) => escapeCell(cell == null ? "" : String(cell)))
        .join(","),
    ),
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
