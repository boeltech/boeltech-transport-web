/**
 * Namespace: fleetDocuments.copy.*
 */

import type {
  DocumentExpiryDocTypeValue,
  DocumentExpirySeverityValue,
  DocumentExpiryStatusValue,
} from "../../domain";

export const fleetDocumentsCopy = {
  page: {
    title: "Documentos por vencer",
    description:
      "Revisa seguros, permisos SCT, licencias y certificados médicos próximos a vencer o ya vencidos.",
    entityLabelPlural: "documentos",
    emptyTitle: "Sin documentos en esta ventana",
    emptyDescription:
      "No hay documentos vencidos ni por vencer con los filtros actuales.",
    refreshSuccess: "Listado actualizado",
    forbiddenToast: "No tienes permiso para ver documentos de flota.",
  },
  filter: {
    withinDaysLabel: "Ventana",
    withinDaysChip: (days: number) => `${days} días`,
    withinDaysAria: (days: number) => `Documentos en los próximos ${days} días`,
    docTypeLabel: "Tipo de documento",
    docTypeAll: "Todos los tipos",
    statusLabel: "Estado",
    statusAll: "Todos",
    showFilters: "Filtros",
    chip: {
      withinDays: (days: string) => `Ventana: ${days} días`,
      docType: (label: string) => `Tipo: ${label}`,
      status: (label: string) => `Estado: ${label}`,
    },
  },
  docType: {
    insurance: "Seguro",
    sct_permit: "Permiso SCT",
    license: "Licencia",
    medical_certificate: "Certificado médico",
  } satisfies Record<DocumentExpiryDocTypeValue, string>,
  status: {
    expired: "Vencido",
    expiring: "Por vencer",
  } satisfies Record<DocumentExpiryStatusValue, string>,
  severity: {
    error: "Vencido",
    warning: "Por vencer",
    info: "Próximo",
  } satisfies Record<DocumentExpirySeverityValue, string>,
  table: {
    entity: "Entidad",
    docType: "Documento",
    expiresOn: "Vence",
    daysRemaining: "Días",
    severity: "Severidad",
    openDetail: "Ver detalle",
    daysExpired: (n: number) => `${Math.abs(n)} vencido`,
    daysLeft: (n: number) => String(n),
    daysUnknown: "—",
    expiresUnknown: "Sin fecha",
  },
} as const;

export type FleetDocumentsCopy = typeof fleetDocumentsCopy;
