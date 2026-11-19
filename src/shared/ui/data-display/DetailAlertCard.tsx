/**
 * DetailAlertCard
 * Shared UI - Data Display
 *
 * Card de alerta con border-l-4 + icon + título + items o children.
 * Slot opcional `action` / `cta` para botones o links de seguimiento (D3).
 *
 * Uso típico — items + action:
 *   <DetailAlertCard
 *     severity="warning"
 *     icon={<AlertTriangle />}
 *     title="Documentos próximos a vencer"
 *     items={[
 *       { label: "Seguro", text: "Vence en 12 días" },
 *       { label: "Permiso SCT", text: "Vence en 28 días" },
 *     ]}
 *     action={
 *       <Button size="sm" variant="outline" onClick={…}>Ver documentos</Button>
 *     }
 *   />
 *
 * Uso libre — children:
 *   <DetailAlertCard severity="critical" icon={<AlertTriangle />} title="Licencia vencida">
 *     <p>La licencia venció hace 5 días ({formatDate(licenseExpiry)})</p>
 *   </DetailAlertCard>
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export type DetailAlertSeverity = "critical" | "warning" | "info";

export interface DetailAlertCardItem {
  /** Etiqueta opcional (en negrita antes del texto). */
  label?: string;
  /** Texto principal del item. */
  text: ReactNode;
}

export interface DetailAlertCardProps {
  /** Nivel de severidad — afecta colores. */
  severity: DetailAlertSeverity;
  /** Icono mostrado a la izquierda. */
  icon?: ReactNode;
  /** Título principal del alert. */
  title: string;
  /**
   * Lista de items que se renderizan como bullets.
   * Si se pasa `children`, los items se ignoran.
   */
  items?: DetailAlertCardItem[];
  /** Contenido libre que sobreescribe `items`. */
  children?: ReactNode;
  /**
   * CTA / acciones del banner (botones, links).
   * Preferir este slot sobre meter botones en `children`.
   */
  action?: ReactNode;
  /** Alias de `action` (mismo slot). Si ambos existen, gana `action`. */
  cta?: ReactNode;
  /**
   * `leading` (default): border-l-4 canónico.
   * `full`: borde completo + CTA a la derecha (paridad Resumen / avisos).
   */
  borderStyle?: "leading" | "full";
  /** Clases extra. */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const severityClasses: Record<
  DetailAlertSeverity,
  {
    leadingBorder: string;
    fullBorder: string;
    bg: string;
    iconColor: string;
  }
> = {
  critical: {
    leadingBorder: "border-l-destructive",
    fullBorder: "border-destructive/40",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
  },
  warning: {
    leadingBorder: "border-l-warning",
    fullBorder: "border-warning/40",
    bg: "bg-warning-soft",
    iconColor: "text-warning",
  },
  info: {
    leadingBorder: "border-l-primary",
    fullBorder: "border-primary/30",
    bg: "bg-primary/5",
    iconColor: "text-primary",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DetailAlertCard({
  severity,
  icon,
  title,
  items,
  children,
  action,
  cta,
  borderStyle = "leading",
  className,
}: DetailAlertCardProps) {
  const styles = severityClasses[severity];
  const actionSlot = action ?? cta;
  const isFull = borderStyle === "full";

  return (
    <Card
      className={cn(
        styles.bg,
        isFull ? cn("border", styles.fullBorder) : cn("border-l-4", styles.leadingBorder),
        className,
      )}
    >
      <CardContent
        className={cn(
          "flex items-start gap-3 py-3",
          isFull && "sm:items-center",
        )}
      >
        {icon ? (
          <span className={cn("mt-0.5 shrink-0", styles.iconColor)}>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">{title}</p>
          {children ? (
            <div className="text-sm text-muted-foreground">{children}</div>
          ) : items && items.length > 0 ? (
            <ul className="space-y-0.5 text-sm text-muted-foreground">
              {items.map((item, idx) => (
                <li key={idx}>
                  {"• "}
                  {item.label ? (
                    <>
                      <span className="font-medium text-foreground/80">
                        {item.label}:
                      </span>{" "}
                    </>
                  ) : null}
                  {item.text}
                </li>
              ))}
            </ul>
          ) : null}
          {!isFull && actionSlot ? (
            <div className="mt-2 flex flex-wrap gap-2">{actionSlot}</div>
          ) : null}
        </div>
        {isFull && actionSlot ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actionSlot}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default DetailAlertCard;
