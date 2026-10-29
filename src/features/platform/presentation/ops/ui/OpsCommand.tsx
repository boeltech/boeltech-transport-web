import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { opsCopy } from "../opsCopy";
import { OpsPortalThemeScope } from "./opsPortal";
import { useOpsPortalContainer } from "./opsPortalContext";

export const OpsCommand = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn("ops-cmdk", className)}
    data-testid="ops-command"
    {...props}
  />
));
OpsCommand.displayName = "OpsCommand";

export const OpsCommandDialog = DialogPrimitive.Root;

export type OpsCommandDialogContentProps =
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

/**
 * CmdK Ops — portal a `#ops-portal-root` (sin flash ERP / popover light).
 */
export const OpsCommandDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  OpsCommandDialogContentProps
>(({ className, children, ...props }, ref) => {
  const container = useOpsPortalContainer();
  const node = (
    <>
      <DialogPrimitive.Overlay className="ops-dialog-backdrop" />
      <DialogPrimitive.Content
        ref={ref}
        data-testid="ops-command-dialog"
        aria-label={opsCopy.a11y.cmdkTitle}
        className={cn("ops-cmdk-dialog", className)}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">
          {opsCopy.a11y.cmdkTitle}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">
          {opsCopy.a11y.cmdkDescription}
        </DialogPrimitive.Description>
        {children}
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
OpsCommandDialogContent.displayName = "OpsCommandDialogContent";

export const OpsCommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="ops-cmdk-input-wrap" cmdk-input-wrapper="">
    <Search className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
    <CommandPrimitive.Input
      ref={ref}
      className={cn("ops-cmdk-input", className)}
      {...props}
    />
  </div>
));
OpsCommandInput.displayName = "OpsCommandInput";

export const OpsCommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("ops-cmdk-list", className)}
    {...props}
  />
));
OpsCommandList.displayName = "OpsCommandList";

export const OpsCommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn("ops-cmdk-empty", className)}
    {...props}
  />
));
OpsCommandEmpty.displayName = "OpsCommandEmpty";

export const OpsCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn("ops-cmdk-group", className)}
    {...props}
  />
));
OpsCommandGroup.displayName = "OpsCommandGroup";

export const OpsCommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn("ops-cmdk-item", className)}
    {...props}
  />
));
OpsCommandItem.displayName = "OpsCommandItem";
