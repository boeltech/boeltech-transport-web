/**
 * Acceso a los servicios de cobro reutilizables.
 *
 * Deja de ser un enlace escondido en un aviso: es un bloque con su conteo y
 * su acceso, al final de la pantalla porque no bloquea la primera factura.
 */

import { memo } from "react";
import { Link } from "react-router-dom";

import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";

import { useBillingServiceConcepts } from "../../application/hooks";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import { SettingsCard } from "./SettingsLayout";

const copy = billingSettingsCopy.serviceConcepts;

export const BillingServiceConceptsCard = memo(
  function BillingServiceConceptsCard() {
    const { data, isLoading } = useBillingServiceConcepts();
    const total = data?.length ?? 0;

    return (
      <SettingsCard
        title={copy.title}
        description={copy.description}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/settings/billing/service-concepts">{copy.manage}</Link>
          </Button>
        }
      >
        {isLoading ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {total > 0 ? copy.count(total) : copy.empty}
          </p>
        )}
      </SettingsCard>
    );
  },
);
