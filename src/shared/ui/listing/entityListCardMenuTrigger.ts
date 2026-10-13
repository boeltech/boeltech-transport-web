import { cn } from "@shared/lib/utils/cn";

/**
 * Trigger del menú ⋯ en EntityListCard:
 * - Sin hover (touch): siempre visible.
 * - Con hover: oculto hasta hover del card, focus-visible o menú abierto.
 */
export const entityListCardMenuTriggerClassName = cn(
  "h-8 w-8 opacity-100 transition-opacity",
  "[@media(hover:hover)]:opacity-0",
  "[@media(hover:hover)]:group-hover:opacity-100",
  "[@media(hover:hover)]:focus-visible:opacity-100",
  "[@media(hover:hover)]:data-[state=open]:opacity-100",
);
