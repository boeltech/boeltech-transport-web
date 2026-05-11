import type { CreateCargoInput } from "@features/trips/domain";
import {
  buildMercanciasHeaderSummary as buildMercanciasHeaderSummaryShared,
  mapWizardCargosToCreateInput as mapWizardCargosToCreateInputShared,
  type MercanciasHeaderSummary,
  type WizardCargoLike,
} from "@boeltech/cfdi-domain";

import type { TripCargoFormValues } from "./components/validation";

export function mapWizardCargosToCreateInput(
  cargos: TripCargoFormValues[] | undefined,
): CreateCargoInput[] | undefined {
  return mapWizardCargosToCreateInputShared(
    cargos as WizardCargoLike[] | undefined,
  ) as CreateCargoInput[] | undefined;
}

export function buildMercanciasHeaderSummary(
  cargos: TripCargoFormValues[] | undefined,
): MercanciasHeaderSummary {
  return buildMercanciasHeaderSummaryShared(cargos as WizardCargoLike[] | undefined);
}
