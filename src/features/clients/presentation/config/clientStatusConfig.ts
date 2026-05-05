/**
 * Client — badge de estado operativo (activo/inactivo).
 *
 * Ubicación: src/features/clients/presentation/config/clientStatusConfig.ts
 */

import { CheckCircle2, MinusCircle } from "lucide-react";
import {
  createStatusConfig,
  type StatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";

/** Claves alineadas a `CLIENT_STATUS_CONFIG.active | inactive`. */
export type ClientOperationalStatus = "active" | "inactive";

export const CLIENT_OPERATIONAL_STATUS_CONFIG: Record<
  ClientOperationalStatus,
  StatusConfig
> = {
  active: createStatusConfig("success", {
    label: "Activo",
    icon: CheckCircle2,
    description: "Cliente activo para operaciones",
  }),

  inactive: createStatusConfig("neutral", {
    label: "Inactivo",
    icon: MinusCircle,
    description: "Cliente inactivo",
  }),
};

export const ClientStatusBadge = createStatusBadgeComponent(
  CLIENT_OPERATIONAL_STATUS_CONFIG,
);

export function operationalStatusFromClient(
  isActive: boolean,
): ClientOperationalStatus {
  return isActive ? "active" : "inactive";
}
