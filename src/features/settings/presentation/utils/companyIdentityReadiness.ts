/**
 * Identidad mínima de la emisora (RFC / razón / régimen / CP) para el link
 * L1b → General. No es regla SAT de timbrado: solo oriente al admin.
 */

export type CompanyIdentitySource = {
  legalName?: string | null;
  rfc?: string | null;
  regimenFiscal?: string | null;
  lugarExpedicion?: string | null;
  fiscalAddress?: { postalCode?: string | null } | null;
  legacyCompanyAddress?: { postalCode?: string | null } | null;
};

function resolvePostalCode(settings: CompanyIdentitySource): string {
  return (
    settings.fiscalAddress?.postalCode?.trim() ||
    settings.lugarExpedicion?.trim() ||
    settings.legacyCompanyAddress?.postalCode?.trim() ||
    ""
  );
}

export function isCompanyIdentityReady(
  settings: CompanyIdentitySource,
): boolean {
  const postal = resolvePostalCode(settings);
  return Boolean(
    settings.legalName?.trim() &&
      settings.rfc?.trim() &&
      settings.regimenFiscal?.trim() &&
      /^\d{5}$/.test(postal),
  );
}
