import { CheckCircle2, Truck, XCircle } from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  TRAILER_STATUS_LABELS,
  TrailerStatus,
  type TrailerStatusType,
} from "../../domain";

export const TRAILER_STATUS_CONFIG: Record<TrailerStatusType, StatusConfig> = {
  [TrailerStatus.AVAILABLE]: createStatusConfig("success", {
    label: TRAILER_STATUS_LABELS[TrailerStatus.AVAILABLE],
    icon: CheckCircle2,
    description: "Listo para asignar a un viaje",
  }),
  [TrailerStatus.RESERVED]: createStatusConfig("warning", {
    label: TRAILER_STATUS_LABELS[TrailerStatus.RESERVED],
    icon: Truck,
    description: "Asignado a un viaje que aún no sale",
  }),
  [TrailerStatus.ON_TRIP]: createStatusConfig("info", {
    label: TRAILER_STATUS_LABELS[TrailerStatus.ON_TRIP],
    icon: Truck,
    description: "En ruta",
  }),
  [TrailerStatus.OUT_OF_SERVICE]: createStatusConfig("danger", {
    label: TRAILER_STATUS_LABELS[TrailerStatus.OUT_OF_SERVICE],
    icon: XCircle,
    description: "No se asigna a viajes",
  }),
};

export const TrailerStatusBadge = createStatusBadgeComponent(
  TRAILER_STATUS_CONFIG,
);
