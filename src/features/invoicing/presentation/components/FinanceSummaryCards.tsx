/**
 * FinanceSummaryCards
 * KPIs del resumen financiero (tab Resumen).
 */

import type { ReactNode } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { StatCard, type StatCardTone } from "@shared/ui/data-display";
import type { FinanceSummary } from "@features/invoicing/domain";

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

interface Props {
  summary?: FinanceSummary;
  isLoading?: boolean;
}

export function FinanceSummaryCards({ summary, isLoading }: Props) {
  const cards: {
    title: string;
    value: string;
    description: string;
    tone: StatCardTone;
    icon: ReactNode;
  }[] = [
    {
      title: "Por cobrar",
      value: summary ? formatMXN(summary.totalReceivable) : "—",
      description: "Facturas timbradas sin pago completo",
      tone: "warning",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Cobrado este mes",
      value: summary ? formatMXN(summary.collectedThisMonth) : "—",
      description: "Pagos registrados en el mes actual",
      tone: "success",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: "Vencido",
      value: summary ? formatMXN(summary.totalOverdue) : "—",
      description: "Facturas PPD con pago pendiente",
      tone: "destructive",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      title: "Gastos del mes",
      value: summary ? formatMXN(summary.expensesThisMonth) : "—",
      description: "Gastos operativos registrados",
      tone: "neutral",
      icon: <Receipt className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          tone={card.tone}
          icon={card.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
