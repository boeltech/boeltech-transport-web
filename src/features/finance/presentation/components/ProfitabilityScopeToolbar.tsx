import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import type { ProfitabilityScope } from "@features/finance/domain";
import { financeCopy } from "../copy";

const SCOPE_OPTIONS: ProfitabilityScope[] = [
  "operational",
  "with_in_progress",
  "pipeline",
  "cancelled",
  "all",
];

interface ProfitabilityScopeToolbarProps {
  scope: ProfitabilityScope;
  onScopeChange: (scope: ProfitabilityScope) => void;
}

export function ProfitabilityScopeToolbar({
  scope,
  onScopeChange,
}: ProfitabilityScopeToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{financeCopy.profitability.scope.label}</p>
        <p className="text-xs text-muted-foreground">
          Delimita qué viajes alimentan KPIs, gráficos y tabla.
        </p>
      </div>
      <Select
        value={scope}
        onValueChange={(value) => onScopeChange(value as ProfitabilityScope)}
      >
        <SelectTrigger
          className="w-[220px]"
          aria-label={financeCopy.profitability.scope.label}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCOPE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {financeCopy.profitability.scope[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
