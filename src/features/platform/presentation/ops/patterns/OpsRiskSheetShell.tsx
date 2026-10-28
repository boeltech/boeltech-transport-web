import type { ReactNode } from "react";
import {
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetFooter,
  OpsSheetHeader,
  OpsSheetTitle,
} from "../ui";

export interface OpsRiskSheetShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Header con tick M2 warn/danger. Default: default. */
  tone?: "danger" | "warn" | "default";
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  testId?: string;
}

/**
 * Shell Ola 3 — header + body denso + footer CTAs; tick M2 en riesgo.
 */
export function OpsRiskSheetShell({
  open,
  onOpenChange,
  title,
  description,
  tone = "default",
  children,
  footer,
  contentClassName,
  testId,
}: OpsRiskSheetShellProps) {
  return (
    <OpsSheet open={open} onOpenChange={onOpenChange}>
      <OpsSheetContent
        className={contentClassName}
        onFocusOutside={(e) => e.preventDefault()}
        data-testid={testId}
      >
        <OpsSheetHeader
          className="ops-risk-header"
          data-tone={tone}
          data-ops-tick={tone === "default" ? undefined : tone}
        >
          <OpsSheetTitle>{title}</OpsSheetTitle>
          {description ? (
            <OpsSheetDescription>{description}</OpsSheetDescription>
          ) : null}
        </OpsSheetHeader>
        <div className="mt-2 space-y-4">{children}</div>
        {footer ? (
          <OpsSheetFooter className="mt-4 gap-2 sm:justify-end">
            {footer}
          </OpsSheetFooter>
        ) : null}
      </OpsSheetContent>
    </OpsSheet>
  );
}
