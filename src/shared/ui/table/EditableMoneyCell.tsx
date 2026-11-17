/**
 * Celda de dinero editable (evolve-ds F1 · SoT §7).
 * Compacta para tablas densas; sin badge (unidad en header, §7 T6).
 */

import { MoneyInput, type MoneyInputProps } from "@shared/ui/form";
import { cn } from "@shared/lib/utils/cn";

export interface EditableMoneyCellProps
  extends Omit<MoneyInputProps, "className"> {
  className?: string;
}

/**
 * Input de monto alineado a la derecha para columnas `moneyEditable`.
 * Sin badge ISO (la moneda va en el header); compacto `max-w-[9rem]`.
 * No cuenta como acción de fila: el caller pasa `onValueChange` / `aria-label`.
 */
export function EditableMoneyCell({
  className,
  ...props
}: EditableMoneyCellProps) {
  return (
    <MoneyInput
      {...props}
      currencyCode=""
      className={cn("ml-auto max-w-[9rem]", className)}
    />
  );
}
