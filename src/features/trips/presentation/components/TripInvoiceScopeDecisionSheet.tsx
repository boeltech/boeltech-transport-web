/**
 * Decision sheet de scopes de facturación (D2 / F3).
 * Patrón Sheet lateral cercano a SubstituteInvoiceSheet — no Dialog.
 * Solo lista scopes elegibles; no inventa opciones.
 */

import { Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import type {
  EligibleTripInvoiceScope,
  TripInvoiceScopeDestination,
} from "../helpers/listEligibleTripInvoiceScopes";

const copy = tripFiscalCopy.scopeDecisionSheet;

const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md";
const SHEET_HEADER_CLASS =
  "shrink-0 space-y-1 border-b px-6 py-4 text-left";
const SHEET_BODY_CLASS =
  "min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4";
const SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end";

export type TripInvoiceScopeDecisionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopes: readonly EligibleTripInvoiceScope[];
  /** full = varios tipos; split_legs = solo porciones de un split. */
  variant: "full" | "split_legs";
  onSelectHref: (href: string) => void;
};

type OptionRow = {
  key: string;
  label: string;
  hint: string;
  href: string;
};

function optionsFromScopes(
  scopes: readonly EligibleTripInvoiceScope[],
  variant: "full" | "split_legs",
): OptionRow[] {
  const rows: OptionRow[] = [];

  for (const scope of scopes) {
    if (scope.kind === "primary_transport") {
      const dest = scope.destinations[0];
      if (!dest) continue;
      rows.push({
        key: "primary_transport",
        label: copy.optionPrimary,
        hint: copy.optionPrimaryHint,
        href: dest.href,
      });
      continue;
    }

    if (scope.kind === "false_trip") {
      const dest = scope.destinations[0];
      if (!dest) continue;
      rows.push({
        key: "false_trip",
        label: copy.optionFalseTrip,
        hint: copy.optionFalseTripHint,
        href: dest.href,
      });
      continue;
    }

    if (scope.kind === "accessory") {
      const dest = scope.destinations[0];
      if (!dest) continue;
      rows.push({
        key: "accessory",
        label: copy.optionAccessory,
        hint: copy.optionAccessoryHint,
        href: dest.href,
      });
      continue;
    }

    if (scope.kind === "split_share") {
      for (const dest of scope.destinations) {
        rows.push(splitDestinationRow(dest));
      }
      continue;
    }
  }

  if (variant === "split_legs") {
    return rows.filter((row) => row.key.startsWith("split_share:"));
  }

  return rows;
}

function splitDestinationRow(dest: TripInvoiceScopeDestination): OptionRow {
  const label = dest.legLabel ?? dest.legId ?? "Porción";
  return {
    key: `split_share:${dest.legId ?? dest.href}`,
    label: copy.optionSplitShare(label),
    hint: copy.optionSplitShareHint,
    href: dest.href,
  };
}

export function TripInvoiceScopeDecisionSheet({
  open,
  onOpenChange,
  scopes,
  variant,
  onSelectHref,
}: TripInvoiceScopeDecisionSheetProps) {
  const options = optionsFromScopes(scopes, variant);
  /** DOM/PRD: cancelar viaje ≠ facturar viaje en falso. */
  const showCancelHint = variant === "full";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SHEET_CONTENT_CLASS}
        side="right"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle>
            {variant === "split_legs" ? copy.splitLegsTitle : copy.title}
          </SheetTitle>
          <SheetDescription>
            {variant === "split_legs"
              ? copy.splitLegsDescription
              : copy.description}
          </SheetDescription>
        </SheetHeader>

        <div className={SHEET_BODY_CLASS}>
          {options.length === 0 ? null : (
            <ul className="space-y-2" role="list">
              {options.map((option) => (
                <li key={option.key}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 rounded-lg border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      onSelectHref(option.href);
                      onOpenChange(false);
                    }}
                  >
                    <Receipt
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 space-y-0.5">
                      <span className="block text-sm font-medium">
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showCancelHint ? (
            <p className="text-xs text-muted-foreground">{copy.cancelVsFalseHint}</p>
          ) : null}
        </div>

        <SheetFooter className={SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default TripInvoiceScopeDecisionSheet;
