import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";

export interface HintIconProps {
  /** Texto accesible del botón (lectores de pantalla). */
  label?: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** Clases del botón disparador. */
  className?: string;
  /** Clases del contenido del tooltip. */
  contentClassName?: string;
}

/**
 * Ayuda contextual compacta: botón con icono que abre un tooltip.
 * Colócalo junto a etiquetas, títulos de sección o encabezados de tarjeta.
 *
 * **Proveedor:** debe existir un ancestro `TooltipProvider` (p. ej. en el layout de la app).
 */
export function HintIcon({
  label = "Más información",
  children,
  side = "top",
  className,
  contentClassName,
}: HintIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
          aria-label={label}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn(
          "max-w-[min(320px,calc(100vw-2rem))] text-xs leading-relaxed",
          contentClassName,
        )}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export interface SectionHeadingWithHintProps {
  /** Título visible (texto o nodo). */
  title: ReactNode;
  hintLabel?: string;
  /**
   * Texto del tooltip. Si se omite, no se muestra el icono (útil para hints condicionales).
   */
  hint?: ReactNode;
  className?: string;
  /** Clases del span del título (solo si `noTitleWrap` es false). */
  titleClassName?: string;
  /** Se pasa a {@link HintIcon}. */
  hintContentClassName?: string;
  hintSide?: HintIconProps["side"];
  /**
   * Si es true, `title` se renderiza sin envolver en el span por defecto (p. ej. {@link FormLabel}, `DialogTitle`).
   */
  noTitleWrap?: boolean;
}

/**
 * Patrón frecuente: título corto en línea + {@link HintIcon} para el texto largo.
 */
export function SectionHeadingWithHint({
  title,
  hintLabel,
  hint,
  className,
  titleClassName,
  hintContentClassName,
  hintSide,
  noTitleWrap,
}: SectionHeadingWithHintProps) {
  const titleEl = noTitleWrap ? (
    title
  ) : (
    <span
      className={cn(
        "text-sm font-semibold leading-tight tracking-tight text-foreground",
        titleClassName,
      )}
    >
      {title}
    </span>
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {titleEl}
      {hint != null ? (
        <HintIcon
          label={hintLabel}
          side={hintSide}
          contentClassName={hintContentClassName}
        >
          {hint}
        </HintIcon>
      ) : null}
    </div>
  );
}
