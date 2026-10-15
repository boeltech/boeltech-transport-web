/**
 * VehicleTypeConfigCoherenceAlert
 *
 * Aviso soft en el detalle cuando el tipo ERP no coincide con la familia de la
 * ConfigVehicular SAT (PRD D4). No bloquea ni cambia campos; el CTA abre la
 * edición en la sección Carta Porte (`vehicles.update`).
 *
 * Montar solo cuando `assessVehicleTypeConfigCoherence(...)` es `mismatch`:
 * así el detalle no consulta catálogos en unidades coherentes.
 */

import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  VEHICLE_TYPE_LABELS,
  type VehicleConfigFamily,
  type VehicleTypeValue,
} from "@features/vehicles/domain";
import { VEHICLE_EDIT_SECTION_IDS } from "./vehicleEditSections";
import { useVehicleCatalogLabels } from "../hooks/useVehicleCatalogLabels";
import { vehiclesCopy } from "../copy";

const copy = vehiclesCopy.detail.coherenceAlert;

interface VehicleTypeConfigCoherenceAlertProps {
  vehicleId: string;
  type: string;
  configCode: string;
  configFamily: VehicleConfigFamily;
  /** `vehicles.update`: con permiso muestra el CTA «Revisar en Carta Porte». */
  canEdit: boolean;
}

/** Deep-link a la sección Carta Porte de la edición (VehicleForm lee el hash al montar). */
function vehicleEditCartaPorteHref(vehicleId: string): string {
  return `/vehicles/${vehicleId}/edit#${VEHICLE_EDIT_SECTION_IDS.cartaPorte}`;
}

export function VehicleTypeConfigCoherenceAlert({
  vehicleId,
  type,
  configCode,
  configFamily,
  canEdit,
}: VehicleTypeConfigCoherenceAlertProps) {
  const { configVehicularLabel } = useVehicleCatalogLabels();
  const typeLabel = VEHICLE_TYPE_LABELS[type as VehicleTypeValue] ?? type;
  const configText = copy.codeWithLabel(
    configCode,
    configVehicularLabel(configCode),
  );
  const familyLabel =
    vehiclesCopy.typeConfigCoherence.familyLabel[configFamily];

  return (
    <DetailAlertCard
      severity="warning"
      icon={<AlertTriangle className="h-5 w-5 text-warning" />}
      title={copy.title}
      action={
        canEdit ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to={vehicleEditCartaPorteHref(vehicleId)}>{copy.cta}</Link>
          </Button>
        ) : undefined
      }
    >
      <p>
        {copy.bodyLead}{" "}
        <strong className="font-medium text-foreground/80">{typeLabel}</strong>,{" "}
        {copy.bodyConfig}{" "}
        <strong className="font-medium text-foreground/80">{configText}</strong>,{" "}
        {copy.bodyFamily}{" "}
        <strong className="font-medium text-foreground/80">{familyLabel}</strong>.{" "}
        {copy.bodyTail}
      </p>
    </DetailAlertCard>
  );
}

export default VehicleTypeConfigCoherenceAlert;
