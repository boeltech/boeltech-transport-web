import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@shared/lib/utils/cn";

type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

type ScrollAreaProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Root
> & {
  /**
   * Qué barras mostrar. `vertical` (default) = sidebar.
   * `horizontal` = franjas de tabs / chips.
   */
  orientation?: ScrollAreaOrientation;
};

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(
  (
    { className, children, type = "hover", orientation = "vertical", ...props },
    ref,
  ) => {
    const showVertical =
      orientation === "vertical" || orientation === "both";
    const showHorizontal =
      orientation === "horizontal" || orientation === "both";

    return (
      <ScrollAreaPrimitive.Root
        ref={ref}
        type={type}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          className={cn(
            "w-full rounded-[inherit]",
            // h-full solo cuando hay scroll vertical; en horizontal deja
            // que la altura la marque el contenido (tabs).
            showVertical ? "h-full" : undefined,
          )}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        {showVertical ? <ScrollBar orientation="vertical" /> : null}
        {showHorizontal ? <ScrollBar orientation="horizontal" /> : null}
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  },
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    forceMount
    className={cn(
      "flex touch-none select-none transition-opacity duration-200",
      "data-[state=hidden]:pointer-events-none data-[state=hidden]:opacity-0",
      "data-[state=visible]:opacity-100",
      orientation === "vertical" &&
        "h-full w-1.5 border-l border-l-transparent p-px",
      orientation === "horizontal" &&
        "h-1.5 flex-col border-t border-t-transparent p-px",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-muted-foreground/30" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
export type { ScrollAreaOrientation };
