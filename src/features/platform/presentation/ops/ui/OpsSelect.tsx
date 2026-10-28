import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { useOpsResolvedTheme } from "../OpsThemeProvider";
import { useOpsPortalContainer } from "./opsPortal";

export const OpsSelect = SelectPrimitive.Root;
export const OpsSelectValue = SelectPrimitive.Value;
export const OpsSelectGroup = SelectPrimitive.Group;

export interface OpsSelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  error?: boolean;
}

export const OpsSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  OpsSelectTriggerProps
>(({ className, children, error, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-ops-select-trigger=""
    data-error={error ? "true" : undefined}
    className={cn("ops-select-trigger ops-ring-accent", className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-60 shrink-0" aria-hidden />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
OpsSelectTrigger.displayName = "OpsSelectTrigger";

export const OpsSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  const container = useOpsPortalContainer();
  const resolved = useOpsResolvedTheme();
  return (
    <SelectPrimitive.Portal container={container ?? undefined}>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        data-testid="ops-select-content"
        data-ops-theme={!container ? resolved : undefined}
        className={cn(
          "ops-select-content",
          !container && "platform-ops",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-0.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
OpsSelectContent.displayName = "OpsSelectContent";

export const OpsSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn("ops-select-item", className)}
    {...props}
  >
    <span className="ops-select-item-check">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
OpsSelectItem.displayName = "OpsSelectItem";
