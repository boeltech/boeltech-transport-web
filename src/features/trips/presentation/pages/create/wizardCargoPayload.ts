import type { CreateCargoInput } from "@features/trips/domain";
import {
  buildMercanciasHeaderSummary as buildMercanciasHeaderSummaryShared,
  mapWizardCargosToCreateInput as mapWizardCargosToCreateInputShared,
  type MercanciasHeaderSummary,
  type WizardCargoLike,
} from "@boeltech/cfdi-domain";

import { V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL } from "@features/trips/domain/v1CargoPlaceholderClient";
import type { TripCargoFormValues } from "./components/validation";

export function mapWizardCargosToCreateInput(
  cargos: TripCargoFormValues[] | undefined,
): CreateCargoInput[] | undefined {
  const mapped = mapWizardCargosToCreateInputShared(
    cargos as WizardCargoLike[] | undefined,
  ) as CreateCargoInput[] | undefined;
  if (!mapped) return undefined;
  return mapped.map((cargo) => ({
    ...cargo,
    clientId: V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL,
  }));
}

export function buildMercanciasHeaderSummary(
  cargos: TripCargoFormValues[] | undefined,
): MercanciasHeaderSummary {
  return buildMercanciasHeaderSummaryShared(cargos as WizardCargoLike[] | undefined);
}
