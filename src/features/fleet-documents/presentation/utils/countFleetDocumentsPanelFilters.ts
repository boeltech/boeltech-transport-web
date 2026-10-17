export function countFleetDocumentsPanelFilters(input: {
  docType: string;
  status: string;
}): number {
  let count = 0;
  if (input.docType) count += 1;
  if (input.status) count += 1;
  return count;
}
