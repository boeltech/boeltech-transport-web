/**
 * Contenedor Card estándar para el indicador WizardSteps.
 * Ubicación: src/shared/ui/wizard/WizardProgressCard.tsx
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";

export interface WizardProgressCardProps {
  children: ReactNode;
  className?: string;
}

export function WizardProgressCard({
  children,
  className,
}: WizardProgressCardProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
