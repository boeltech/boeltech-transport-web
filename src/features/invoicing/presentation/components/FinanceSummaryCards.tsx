/**
 * FinanceSummaryCards
 * Clean Architecture - Presentation Layer (Components)
 *
 * KPI cards del resumen financiero. Usadas en SummaryTab (FinancePage).
 */

import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { FinanceSummary } from "@features/invoicing/domain";

// ============================================================================
// HELPERS
// ============================================================================

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  summary?: FinanceSummary;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FinanceSummaryCards({ summary, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      title: "Por cobrar",
      value: formatMXN(summary.totalReceivable),
      description: "Facturas timbradas sin pago completo",
      icon: DollarSign,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-600 dark:text-blue-400",
      indicator:
        summary.totalReceivable > 0
          ? { label: "Pendiente de cobro", variant: "blue" as const }
          : { label: "Sin saldo pendiente", variant: "green" as const },
    },
    {
      title: "Cobrado este mes",
      value: formatMXN(summary.collectedThisMonth),
      description: "Pagos registrados en el mes actual",
      icon: TrendingUp,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      valueColor: "text-green-600 dark:text-green-400",
      indicator:
        summary.collectedThisMonth > 0
          ? { label: "Ingresos recibidos", variant: "green" as const }
          : { label: "Sin cobros este mes", variant: "muted" as const },
    },
    {
      title: "Vencido",
      value: formatMXN(summary.totalOverdue),
      description: "Facturas PPD con pago pendiente",
      icon: AlertTriangle,
      iconBg:
        summary.totalOverdue > 0
          ? "bg-red-100 dark:bg-red-900/30"
          : "bg-muted",
      iconColor:
        summary.totalOverdue > 0
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground",
      valueColor:
        summary.totalOverdue > 0
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground",
      indicator:
        summary.totalOverdue > 0
          ? { label: "Requiere atención", variant: "red" as const }
          : { label: "Sin vencidos", variant: "green" as const },
    },
    {
      title: "Gastos del mes",
      value: formatMXN(summary.expensesThisMonth),
      description: "Gastos operativos registrados",
      icon: Receipt,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      valueColor: "text-orange-600 dark:text-orange-400",
      indicator:
        summary.expensesThisMonth > 0
          ? { label: "Gastos del período", variant: "orange" as const }
          : { label: "Sin gastos registrados", variant: "muted" as const },
    },
  ];

  const indicatorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                    card.iconBg,
                  )}
                >
                  <Icon className={cn("h-4 w-4", card.iconColor)} />
                </div>
              </div>
              <p className={cn("text-2xl font-bold", card.valueColor)}>
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {card.description}
              </p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  indicatorClasses[card.indicator.variant],
                )}
              >
                {card.indicator.label}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
