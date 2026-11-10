import { Users } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList;

/**
 * Stub List Operadores (F2) — readiness completo en F3.
 * Evita 404 en la ruta canónica TEC C.2.
 */
export function OperatorPaymentsOperatorsPage() {
  return (
    <ListPageShell
      title={copy.title}
      description={copy.description}
      items={[]}
      isLoading={false}
      entityLabelPlural={copy.entityLabelPlural}
      emptyState={{
        icon: <Users className="h-8 w-8 text-muted-foreground" />,
        title: copy.comingSoonTitle,
        description: copy.comingSoonDescription,
      }}
      renderTable={() => null}
    />
  );
}
