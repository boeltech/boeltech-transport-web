/**
 * Import job status badge config.
 */

import {
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Ban,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  IMPORT_JOB_STATUS_LABELS,
  type ImportJobStatus,
} from "../../domain";

export const IMPORT_JOB_STATUS_CONFIG: Record<ImportJobStatus, StatusConfig> = {
  uploaded: createStatusConfig("neutral", {
    label: IMPORT_JOB_STATUS_LABELS.uploaded,
    icon: Upload,
    description: "Archivo recibido, aún sin revisar",
  }),
  validated: createStatusConfig("info", {
    label: IMPORT_JOB_STATUS_LABELS.validated,
    icon: Clock,
    description: "Revisado, pendiente de aplicar",
  }),
  committed: createStatusConfig("success", {
    label: IMPORT_JOB_STATUS_LABELS.committed,
    icon: CheckCircle2,
    description: "Carga aplicada",
  }),
  failed: createStatusConfig("danger", {
    label: IMPORT_JOB_STATUS_LABELS.failed,
    icon: XCircle,
    description: "No se pudo aplicar o no hubo filas listas",
  }),
  cancelled: createStatusConfig("neutral", {
    label: IMPORT_JOB_STATUS_LABELS.cancelled,
    icon: Ban,
    description: "Carga cancelada",
  }),
};

export const ImportJobStatusBadge = createStatusBadgeComponent(
  IMPORT_JOB_STATUS_CONFIG,
);
