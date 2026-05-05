/**
 * Tab "Términos comerciales" del detalle de cliente (shell canónico).
 *
 * InfoRow variant="inline" alineado al detalle de empleado.
 */

import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import { InfoRow } from "@shared/ui/data-display";
import { CreditCard } from "lucide-react";

import type { Client } from "../../domain";
import type { PaymentTermsConfig } from "../config/clientConfig";

export interface ClientDetailCommercialTabProps {
  client: Client;
  paymentConfig: PaymentTermsConfig;
  PaymentIcon: ComponentType<{ className?: string }>;
}

export function ClientDetailCommercialTab({
  client,
  paymentConfig,
  PaymentIcon,
}: ClientDetailCommercialTabProps) {
  return (
    <div className="space-y-4">
      <Card className="max-w-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Términos comerciales
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            variant="inline"
            label="Forma de pago"
            value={
              <Badge variant={paymentConfig.variant}>
                <PaymentIcon className="mr-1 h-3 w-3" />
                {paymentConfig.label}
              </Badge>
            }
          />
          {client.paymentTerms === "credit" ? (
            <>
              <Separator className="my-2" />
              <InfoRow
                variant="inline"
                label="Días de crédito"
                value={`${client.creditDays} días`}
              />
              {client.creditLimit !== undefined && client.creditLimit > 0 ? (
                <InfoRow
                  variant="inline"
                  label="Límite de crédito"
                  value={`$${client.creditLimit.toLocaleString("es-MX")}`}
                />
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
