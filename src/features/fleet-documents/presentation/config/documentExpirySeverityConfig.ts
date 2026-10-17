import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import { createStatusConfig } from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import type { DocumentExpirySeverityValue } from "../../domain";
import { fleetDocumentsCopy } from "../copy";

export const DOCUMENT_EXPIRY_SEVERITY_CONFIG: Record<
  DocumentExpirySeverityValue,
  ReturnType<typeof createStatusConfig>
> = {
  error: createStatusConfig("destructive", {
    label: fleetDocumentsCopy.severity.error,
    icon: CircleAlert,
    description: "Documento vencido",
    tone: "solid",
  }),
  warning: createStatusConfig("warning", {
    label: fleetDocumentsCopy.severity.warning,
    icon: AlertTriangle,
    description: "Documento próximo a vencer",
  }),
  info: createStatusConfig("info", {
    label: fleetDocumentsCopy.severity.info,
    icon: Info,
    description: "Documento dentro de la ventana de alerta",
  }),
};

export const DocumentExpirySeverityBadge = createStatusBadgeComponent(
  DOCUMENT_EXPIRY_SEVERITY_CONFIG,
);
