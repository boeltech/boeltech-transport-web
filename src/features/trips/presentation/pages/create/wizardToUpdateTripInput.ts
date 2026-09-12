/**
 * Construye el mismo `UpdateTripInput` que envía el wizard al editar un viaje,
 * para validarlo con `updateTripSchema` del paquete (ADR-0043 WS-D).
 */
import type { UpdateTripInput } from "@features/trips/domain";
import type { TripWizardFormValues } from "./components/validation";
import {
  buildCreateTripInputFromWizardValues,
  type BuildCreateTripInputOptions,
} from "./wizardToCreateTripInput";
import { buildUpdateTripInputFromCreateInput } from "./updateTripPayloadShared";

export function buildUpdateTripInputFromWizardValues(
  data: TripWizardFormValues,
  buildOptions?: Pick<BuildCreateTripInputOptions, "allowExpiredDocs">,
): UpdateTripInput {
  const base = buildCreateTripInputFromWizardValues(data, buildOptions);
  return buildUpdateTripInputFromCreateInput(base);
}
