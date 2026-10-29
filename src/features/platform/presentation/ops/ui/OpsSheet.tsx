import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@shared/hooks/useBodyScrollLock";
import { cn } from "@shared/lib/utils/cn";
import { preventDismissOnSonnerToast } from "@shared/ui/toast/sonnerDismissGuard";
import { OpsPortalThemeScope } from "./opsPortal";
import { useOpsPortalContainer } from "./opsPortalContext";

const OpsSheetOpenContext = React.createContext(false);

function OpsSheetScrollLock() {
  const open = React.useContext(OpsSheetOpenContext);
  useBodyScrollLock(open);
  return null;
}

/**
 * Sheet Ops — portal a `#ops-portal-root` (hereda `.platform-ops`).
 * No-modal por defecto (paridad ERP sheet + toasts Sonner).
 */
export function OpsSheet({
  modal = false,
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = openProp !== undefined;
  const isOpen = isControlled ? openProp : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) setUncontrolledOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return (
    <OpsSheetOpenContext.Provider value={isOpen}>
      <DialogPrimitive.Root
        modal={modal}
        open={openProp}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </OpsSheetOpenContext.Provider>
  );
}

export const OpsSheetTrigger = DialogPrimitive.Trigger;
export const OpsSheetClose = DialogPrimitive.Close;

function splitOpsSheetSlots(children: React.ReactNode) {
  const header: React.ReactNode[] = [];
  const body: React.ReactNode[] = [];
  const footer: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    const name =
      React.isValidElement(child) && typeof child.type !== "string"
        ? (child.type as { displayName?: string }).displayName
        : undefined;
    if (name === "OpsSheetHeader") header.push(child);
    else if (name === "OpsSheetFooter") footer.push(child);
    else body.push(child);
  });
  return { header, body, footer };
}

export interface OpsSheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: "right" | "left";
}

export const OpsSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  OpsSheetContentProps
>(
  (
    {
      side = "right",
      className,
      children,
      onPointerDownOutside,
      onInteractOutside,
      ...props
    },
    ref,
  ) => {
    const container = useOpsPortalContainer();
    const slots = splitOpsSheetSlots(children);
    const node = (
      <>
        <OpsSheetScrollLock />
        <div
          aria-hidden="true"
          data-ops-sheet-backdrop=""
          className="ops-sheet-backdrop"
        />
        <DialogPrimitive.Content
          ref={ref}
          data-side={side}
          data-testid="ops-sheet-content"
          className={cn("ops-sheet-content", className)}
          onPointerDownOutside={(event) => {
            preventDismissOnSonnerToast(event);
            onPointerDownOutside?.(event);
          }}
          onInteractOutside={(event) => {
            preventDismissOnSonnerToast(event);
            onInteractOutside?.(event);
          }}
          {...props}
        >
          {slots.header}
          <div className="ops-sheet-body">{slots.body}</div>
          {slots.footer}
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
  },
);
OpsSheetContent.displayName = "OpsSheetContent";

export function OpsSheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ops-sheet-header flex flex-col space-y-2 text-left",
        className,
      )}
      {...props}
    />
  );
}
OpsSheetHeader.displayName = "OpsSheetHeader";

export function OpsSheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ops-sheet-footer", className)} {...props} />;
}
OpsSheetFooter.displayName = "OpsSheetFooter";

export const OpsSheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("ops-type-body font-semibold tracking-tight", className)}
    {...props}
  />
));
OpsSheetTitle.displayName = "OpsSheetTitle";

export const OpsSheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs ops-text-muted", className)}
    {...props}
  />
));
OpsSheetDescription.displayName = "OpsSheetDescription";
