import type { ReactNode } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { FormSectionCard } from "@shared/ui/form-section-card";

export interface SummaryReviewSectionProps {
  title: string;
  icon?: ReactNode;
  count?: number;
  stepIndex: number;
  onGoToStep: (stepIndex: number) => void;
  children: ReactNode;
}

export function SummaryReviewSection({
  title,
  icon,
  count,
  stepIndex,
  onGoToStep,
  children,
}: SummaryReviewSectionProps) {
  return (
    <FormSectionCard
      title={
        <span className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            {icon}
            <span>{title}</span>
            {count != null ? (
              <Badge variant="secondary" className="font-normal">
                {count}
              </Badge>
            ) : null}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0"
            onClick={() => onGoToStep(stepIndex)}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        </span>
      }
      contentClassName="space-y-4"
    >
      {children}
    </FormSectionCard>
  );
}
