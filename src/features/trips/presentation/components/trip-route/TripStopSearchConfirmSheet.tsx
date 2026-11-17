/**
 * F9 — Panel único Buscar→Confirmar del alta de ruta (D58/D68).
 * Sustituye StopFormSheet en el flujo de Reserva/Ruta alta.
 * Reusa el formulario canónico (AddressInput carta-porte + partners + write-back).
 */

import {
  StopFormSheet,
  type StopFormSheetProps,
} from "../../pages/create/components/StopFormSheet";

export type TripStopSearchConfirmSheetProps = StopFormSheetProps;

/**
 * Wrapper de alta: misma superficie Confirmar que Completar domicilio.
 * El buscador vive en el panel detalle (TripRouteSlotCapture); este sheet
 * es el paso Confirmar (y Completar domicilio).
 */
export function TripStopSearchConfirmSheet(props: TripStopSearchConfirmSheetProps) {
  return <StopFormSheet {...props} />;
}
