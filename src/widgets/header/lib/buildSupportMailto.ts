import { headerCopy } from "../copy/headerCopy";

export interface SupportMailtoInput {
  supportEmail: string;
  productName: string;
  tenantName?: string | null;
  userEmail?: string | null;
  currentPath: string;
  environment: string;
  release: string;
}

/**
 * Construye un `mailto:` con asunto y cuerpo útiles para soporte.
 */
export function buildSupportMailto(input: SupportMailtoInput): string {
  const copy = headerCopy.help;
  const tenantName = input.tenantName?.trim() || copy.contextMissing;
  const userEmail = input.userEmail?.trim() || copy.contextMissing;
  const currentPath = input.currentPath.trim() || "/";
  const subject = copy.mailtoSubject(input.productName, input.tenantName?.trim() ?? "");
  const body = copy.mailtoBody({
    productName: input.productName,
    tenantName,
    userEmail,
    currentPath,
    environment: input.environment || copy.contextMissing,
    release: input.release || copy.contextMissing,
  });

  const params = new URLSearchParams({
    subject,
    body,
  });
  // URLSearchParams usa + para espacios; mailto prefiere %20
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${input.supportEmail}?${query}`;
}
