import { useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { clientsCopy } from "../copy/clientsCopy";

const copy = clientsCopy.filter;

export interface ClientListFiltersProps {
  type: string;
  paymentTerms: string;
  status: string;
  activePanelFilterCount: number;
  onTypeChange: (value: string) => void;
  onPaymentTermsChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

/**
 * Recortes del catálogo de clientes (tipo / pago / estado).
 * El lookup vive en el search; importar y la vista no son recortes.
 */
export function ClientListFilters({
  type,
  paymentTerms,
  status,
  activePanelFilterCount,
  onTypeChange,
  onPaymentTermsChange,
  onStatusChange,
}: ClientListFiltersProps) {
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  const hasActiveFilters = activePanelFilterCount > 0;
  const open = hasActiveFilters
    ? !userCollapsedWhileActive
    : userExpandedWhileIdle;

  const handleOpenChange = (next: boolean) => {
    if (hasActiveFilters) {
      setUserCollapsedWhileActive(!next);
      return;
    }
    setUserExpandedWhileIdle(next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="contents"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {copy.showFilters}
          {activePanelFilterCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
              {activePanelFilterCount}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="order-last w-full basis-full">
        <Card className="bg-muted/30">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="clients-filter-type">{copy.typeLabel}</Label>
              <Select value={type || "all"} onValueChange={onTypeChange}>
                <SelectTrigger
                  id="clients-filter-type"
                  className="w-full"
                  aria-label={copy.typeLabel}
                >
                  <SelectValue placeholder={copy.typeLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.typeAll}</SelectItem>
                  <SelectItem value="company">{copy.typeMoral}</SelectItem>
                  <SelectItem value="individual">{copy.typeIndividual}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clients-filter-payment">{copy.paymentLabel}</Label>
              <Select
                value={paymentTerms || "all"}
                onValueChange={onPaymentTermsChange}
              >
                <SelectTrigger
                  id="clients-filter-payment"
                  className="w-full"
                  aria-label={copy.paymentLabel}
                >
                  <SelectValue placeholder={copy.paymentLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.paymentAll}</SelectItem>
                  <SelectItem value="cash">{copy.paymentCash}</SelectItem>
                  <SelectItem value="credit">{copy.paymentCredit}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clients-filter-status">{copy.statusLabel}</Label>
              <Select value={status || "all"} onValueChange={onStatusChange}>
                <SelectTrigger
                  id="clients-filter-status"
                  className="w-full"
                  aria-label={copy.statusLabel}
                >
                  <SelectValue placeholder={copy.statusLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.statusAll}</SelectItem>
                  <SelectItem value="active">{copy.statusActive}</SelectItem>
                  <SelectItem value="inactive">{copy.statusInactive}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
