import { Plus, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FieldInlineError,
  MoneyInput,
  getFieldErrorAriaProps,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { cn } from "@shared/lib/utils/cn";
import {
  MANUAL_SETTLEMENT_ITEM_TYPES,
  deriveManualItemIsDeduction,
  manualItemNeedsDirection,
  type ManualSettlementItemType,
} from "../../domain/settlementTotals";
import { formatSignedManualAmount } from "../utils/settlementEditing";
import { settlementsCopy } from "../copy/settlementsCopy";
import { MANUAL_ITEM_DESCRIPTION_MAX } from "../validation/settlementSchemas";
import {
  newManualItemRow,
  type ManualItemRow,
  type ManualItemRowErrors,
} from "../utils/manualItemRows";

const copy = settlementsCopy.settlementFlow.manualItems;
const NO_TRIP = "__none__";
const DIRECTION_ADD = "add";
const DIRECTION_SUBTRACT = "subtract";

export type { ManualItemRow, ManualItemRowErrors };

export interface ManualItemsEditorProps {
  value: ManualItemRow[];
  onChange: (rows: ManualItemRow[]) => void;
  /** Errores por índice de fila. */
  errors?: ReadonlyArray<ManualItemRowErrors | undefined>;
  /** Solo viajes de esta liquidación; sin opciones se oculta el selector. */
  tripOptions?: ReadonlyArray<{ tripId: string; tripCode: string }>;
  disabled?: boolean;
  idPrefix: string;
  /** Columna angosta (resumen del alta): campos apilados. */
  stacked?: boolean;
  className?: string;
}

/**
 * Editor compartido de partidas manuales (ADR-0085 E10, handoff 07 D22.2/D24):
 * Tipo, Sentido solo para Ajuste, Descripción, Monto y Viaje opcional; el signo
 * de cada fila se deriva del tipo.
 */
export function ManualItemsEditor({
  value,
  onChange,
  errors,
  tripOptions = [],
  disabled = false,
  idPrefix,
  stacked = false,
  className,
}: ManualItemsEditorProps) {
  const updateRow = (index: number, patch: Partial<ManualItemRow>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  /** Al cambiar el tipo el sentido se vuelve a elegir (solo Ajuste lo declara). */
  const changeType = (index: number, itemType: ManualSettlementItemType) => {
    updateRow(index, { itemType, isDeduction: undefined });
  };

  return (
    <div className={cn("space-y-3", className)} data-testid={`${idPrefix}-manual-items`}>
      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">{copy.empty}</p>
      ) : null}

      {value.map((row, index) => {
        const rowErrors = errors?.[index];
        const base = `${idPrefix}-${index}`;
        const needsDirection = manualItemNeedsDirection(row.itemType);
        const signed =
          typeof row.amount === "number" && row.amount > 0 && (!needsDirection || row.isDeduction !== undefined)
            ? formatSignedManualAmount({
                itemType: row.itemType,
                description: row.description,
                amount: row.amount,
                isDeduction: row.isDeduction,
              })
            : null;
        const subtracts = deriveManualItemIsDeduction(row);

        return (
          <fieldset
            key={row.key}
            className="space-y-2 rounded-md border bg-muted/20 p-3"
            aria-label={copy.rowLabel(index + 1)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {copy.rowLabel(index + 1)}
              </span>
              <div className="flex items-center gap-1">
                {signed ? (
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums",
                      subtracts ? "text-destructive" : "text-success",
                    )}
                    data-testid={`${base}-sign`}
                  >
                    {signed}
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeRow(index)}
                  disabled={disabled}
                  aria-label={`${copy.remove} ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className={cn("grid gap-2", !stacked && "sm:grid-cols-2")}>
              <div className="space-y-1">
                <Label htmlFor={`${base}-type`} className="text-xs">
                  {copy.typeLabel}
                </Label>
                <Select
                  value={row.itemType}
                  onValueChange={(next) => changeType(index, next as ManualSettlementItemType)}
                  disabled={disabled}
                >
                  <SelectTrigger
                    id={`${base}-type`}
                    {...getFieldErrorAriaProps(`${base}-type`, rowErrors?.itemType)}
                  >
                    <SelectValue placeholder={copy.typePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_SETTLEMENT_ITEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {copy.types[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldInlineError fieldId={`${base}-type`} message={rowErrors?.itemType} />
              </div>

              {needsDirection ? (
                <div className="space-y-1">
                  <Label htmlFor={`${base}-direction`} className="text-xs">
                    {copy.directionLabel}
                  </Label>
                  <Select
                    value={
                      row.isDeduction === undefined
                        ? undefined
                        : row.isDeduction
                          ? DIRECTION_SUBTRACT
                          : DIRECTION_ADD
                    }
                    onValueChange={(next) =>
                      updateRow(index, { isDeduction: next === DIRECTION_SUBTRACT })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger
                      id={`${base}-direction`}
                      {...getFieldErrorAriaProps(`${base}-direction`, rowErrors?.isDeduction)}
                    >
                      <SelectValue placeholder={copy.directionPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DIRECTION_ADD}>{copy.directionAdd}</SelectItem>
                      <SelectItem value={DIRECTION_SUBTRACT}>{copy.directionSubtract}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInlineError
                    fieldId={`${base}-direction`}
                    message={rowErrors?.isDeduction}
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor={`${base}-description`} className="text-xs">
                {copy.descriptionLabel}
              </Label>
              <Input
                id={`${base}-description`}
                value={row.description}
                maxLength={MANUAL_ITEM_DESCRIPTION_MAX}
                placeholder={copy.descriptionPlaceholder}
                onChange={(event) => updateRow(index, { description: event.target.value })}
                disabled={disabled}
                {...getRegisterFieldErrorProps(`${base}-description`, rowErrors?.description)}
              />
              <FieldInlineError
                fieldId={`${base}-description`}
                message={rowErrors?.description}
              />
            </div>

            <div className={cn("grid gap-2", !stacked && tripOptions.length > 0 && "sm:grid-cols-2")}>
              <div className="space-y-1">
                <Label htmlFor={`${base}-amount`} className="text-xs">
                  {copy.amountLabel}
                </Label>
                <MoneyInput
                  id={`${base}-amount`}
                  value={row.amount}
                  onValueChange={(amount) => updateRow(index, { amount })}
                  currencyCode="MXN"
                  decimals={2}
                  disabled={disabled}
                  error={Boolean(rowErrors?.amount)}
                  {...getFieldErrorAriaProps(`${base}-amount`, rowErrors?.amount)}
                />
                <FieldInlineError fieldId={`${base}-amount`} message={rowErrors?.amount} />
              </div>

              {tripOptions.length > 0 ? (
                <div className="space-y-1">
                  <Label htmlFor={`${base}-trip`} className="text-xs">
                    {copy.tripLabel}
                  </Label>
                  <Select
                    value={row.tripId ?? NO_TRIP}
                    onValueChange={(next) =>
                      updateRow(index, { tripId: next === NO_TRIP ? null : next })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger
                      id={`${base}-trip`}
                      {...getFieldErrorAriaProps(`${base}-trip`, rowErrors?.tripId)}
                    >
                      <SelectValue placeholder={copy.tripNone} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TRIP}>{copy.tripNone}</SelectItem>
                      {tripOptions.map((trip) => (
                        <SelectItem key={trip.tripId} value={trip.tripId}>
                          {trip.tripCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldInlineError fieldId={`${base}-trip`} message={rowErrors?.tripId} />
                </div>
              ) : null}
            </div>
          </fieldset>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, newManualItemRow()])}
        disabled={disabled}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        {copy.add}
      </Button>
    </div>
  );
}
