/**
 * Empty-state CTA when a prior activation master is missing.
 */

import type { ReactNode } from "react";
import type { NavigateFunction } from "react-router-dom";

import type { ActivationEmptyGuidance } from "../../domain/activation";
import type { ActivationItemCode } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";

const copy = dashboardCopy.activation;

export function activationGapDescription(gapCode: ActivationItemCode): string {
  return copy.emptyGapDescription[gapCode] ?? copy.description;
}

export function activationGapCtaLabel(gapCode: ActivationItemCode): string {
  return copy.ctaLabels[gapCode] ?? copy.itemLabels[gapCode];
}

export function buildActivationGapEmptyCta(
  guidance: ActivationEmptyGuidance,
  navigate: NavigateFunction,
  icon?: ReactNode,
) {
  return {
    description: activationGapDescription(guidance.gapCode),
    cta: {
      label: activationGapCtaLabel(guidance.gapCode),
      onClick: () => {
        navigate(guidance.ctaPath);
      },
      icon,
    },
  };
}
