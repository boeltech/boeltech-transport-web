import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { OpsPortalThemeScope, useOpsPortalContainer } from "./opsPortal";

export const OpsDialog = DialogPrimitive.Root;
export const OpsDialogTrigger = DialogPrimitive.Trigger;
export const OpsDialogClose = DialogPrimitive.Close;

export interface OpsDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Confirmaciones destructivas (suspender, anular). Default: danger. */
  tone?: "danger" | "default";
}

/**
 * Dialog Ops — portal a `#ops-portal-root`. Pensado para confirmaciones danger.
 */
export const OpsDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  OpsDialogContentProps
>(({ className, children, tone = "danger", ...props }, ref) => {
  const container = useOpsPortalContainer();
  const node = (
    <>
      <DialogPrimitive.Overlay className="ops-dialog-backdrop" />
      <DialogPrimitive.Content
        ref={ref}
        data-tone={tone}
        data-testid="ops-dialog-content"
        className={cn("ops-dialog-content", className)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ops-sheet-close ops-ring-accent">
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </>
  );
  return (
    <DialogPrimitive.Portal container={container}>
      {container ? (
        node
      ) : (
        <OpsPortalThemeScope>{node}</OpsPortalThemeScope>
      )}
    </DialogPrimitive.Portal>
  );
});
OpsDialogContent.displayName = "OpsDialogContent";

export function OpsDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left", className)}
      {...props}
    />
  );
}

export function OpsDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export const OpsDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("ops-type-title ops-text", className)}
    {...props}
  />
));
OpsDialogTitle.displayName = "OpsDialogTitle";

export const OpsDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs ops-text-muted", className)}
    {...props}
  />
));
OpsDialogDescription.displayName = "OpsDialogDescription";
