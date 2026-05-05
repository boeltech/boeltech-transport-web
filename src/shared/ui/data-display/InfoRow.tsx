/**
 * InfoRow
 * Shared UI - Data Display
 *
 * Fila de información reutilizable para páginas de detalle.
 * Soporta dos variantes visuales para distintos tipos de contenido:
 *
 * - `variant="stacked"` (default): icon + label arriba / value abajo.
 *   Bueno para datos visuales que se escanean (Vehicle, Driver, Trip resumen).
 *
 * - `variant="inline"`: label izquierda / value derecha con border-b.
 *   Bueno para datos densos que se leen detenidamente o se copian
 *   (CURP, RFC, NSS, VIN). Soporta `copyable` y `mono`.
 *   `copyable` también está disponible en `variant="stacked"`.
 *
 * Reemplaza:
 * - InfoRow local de Vehicle/Driver/Client (variant="stacked", default)
 * - InfoRow local de Trip (variant="inline" sin copyable)
 * - DetailInfoRow propio de Employee (variant="inline" copyable mono)
 */

import { useCallback, type ReactNode } from "react";
import { AlertTriangle, Copy } from "lucide-react";
import { Button } from "@shared/ui/button";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export type InfoRowAlert = "expired" | "warning";
export type InfoRowVariant = "stacked" | "inline";

export interface InfoRowProps {
  /** Icono lateral. Opcional en variant="inline". */
  icon?: ReactNode;
  /** Etiqueta corta del campo (puede incluir `SatFieldLabel` u otro nodo). */
  label: ReactNode;
  /** Valor del campo. */
  value: ReactNode;
  /**
   * Layout de la fila:
   * - "stacked" (default) → icon + (label / value)
   * - "inline" → label izq. / value der., separator border-b
   */
  variant?: InfoRowVariant;
  /**
   * Añade un botón de copiar al portapapeles (`variant="inline"` o `"stacked"`).
   *
   * - Si `value` es string, copia ese texto.
   * - Si `value` no es string, debes pasar `copyValue` con el texto a copiar.
   * - Si no hay texto válido, el botón no se renderiza.
   */
  copyable?: boolean;
  /** Override del texto que se copia (necesario si `value` no es string). */
  copyValue?: string;
  /** Solo aplica a variant="inline": muestra `value` en font-mono. */
  mono?: boolean;
  /**
   * Alerta visual:
   * - "expired" → rojo
   * - "warning" → ámbar
   */
  alert?: InfoRowAlert;
  /** Clases extra para el contenedor exterior. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InfoRow(props: InfoRowProps) {
  if (props.variant === "inline") {
    return <InlineInfoRow {...props} />;
  }
  return <StackedInfoRow {...props} />;
}

// ============================================================================
// VARIANT: STACKED (default)
// ============================================================================

function StackedInfoRow({
  icon,
  label,
  value,
  alert,
  className,
  copyable,
  copyValue,
}: InfoRowProps) {
  const { toast } = useToast();
  const copyText =
    copyValue ?? (typeof value === "string" ? value : undefined);
  const showCopyButton = !!copyable && !!copyText;

  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      toast({ title: "Copiado al portapapeles" });
    } catch {
      toast({
        title: "No se pudo copiar",
        variant: "destructive",
      });
    }
  }, [toast, copyText]);

  return (
    <div className={cn("flex items-start gap-3", className)}>
      {icon ? (
        <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex min-w-0 items-start gap-2">
          <div
            className={cn(
              "min-w-0 flex-1 text-sm font-medium",
              alert && "flex items-center gap-1.5",
              alert === "expired" && "text-destructive",
              alert === "warning" && "text-amber-600 dark:text-amber-500",
            )}
          >
            {alert ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
            {value}
          </div>
          {showCopyButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => void handleCopy()}
              aria-label={
                typeof label === "string" ? `Copiar ${label}` : "Copiar al portapapeles"
              }
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT: INLINE
// ============================================================================

function InlineInfoRow({
  label,
  value,
  copyable,
  copyValue,
  mono,
  alert,
  className,
}: InfoRowProps) {
  const { toast } = useToast();

  // Texto efectivo a copiar:
  // - copyValue explícito tiene prioridad
  // - si value es string, se usa value
  // - si nada de lo anterior, copyable se ignora
  const copyText =
    copyValue ?? (typeof value === "string" ? value : undefined);
  const showCopyButton = !!copyable && !!copyText;

  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      toast({ title: "Copiado al portapapeles" });
    } catch {
      toast({
        title: "No se pudo copiar",
        variant: "destructive",
      });
    }
  }, [toast, copyText]);

  const isEmpty =
    value === null || value === undefined || value === "";
  const displayValue = isEmpty ? "—" : value;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b py-2.5 last:border-0",
        "sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <span className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground sm:text-sm">
        {label}
      </span>
      <div className="flex min-w-0 items-start justify-end gap-1.5 sm:gap-2">
        <span
          title={typeof displayValue === "string" ? displayValue : undefined}
          className={cn(
            "max-w-full break-words text-left text-sm leading-relaxed sm:text-right",
            mono && "font-mono",
            isEmpty && "italic text-muted-foreground",
            alert === "expired" && "text-destructive",
            alert === "warning" && "text-amber-600 dark:text-amber-500",
          )}
        >
          {displayValue}
        </span>
        {showCopyButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleCopy}
            aria-label={
              typeof label === "string"
                ? `Copiar ${label}`
                : "Copiar al portapapeles"
            }
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default InfoRow;
