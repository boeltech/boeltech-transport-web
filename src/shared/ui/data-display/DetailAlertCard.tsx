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
  /** Clases extra. */
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const severityClasses: Record<
  DetailAlertSeverity,
  { border: string; bg: string; iconColor: string }
> = {
  critical: {
    border: "border-l-destructive",
    bg: "bg-destructive/5",
    iconColor: "text-destructive",
  },
  warning: {
    border: "border-l-warning",
    bg: "bg-warning-soft",
    iconColor: "text-warning",
  },
  info: {
    border: "border-l-primary",
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
  className,
}: DetailAlertCardProps) {
  const styles = severityClasses[severity];
  const actionSlot = action ?? cta;

  return (
    <Card className={cn("border-l-4", styles.border, styles.bg, className)}>
      <CardContent className="flex items-start gap-3 py-3">
        {icon ? (
          <span className={cn("shrink-0 mt-0.5", styles.iconColor)}>
            {icon}
          </span>
        ) : null}
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-medium">{title}</p>
          {children ? (
            <div className="text-sm text-muted-foreground">{children}</div>
          ) : items && items.length > 0 ? (
            <ul className="text-sm text-muted-foreground space-y-0.5">
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
          {actionSlot ? (
            <div className="mt-2 flex flex-wrap gap-2">{actionSlot}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default DetailAlertCard;
