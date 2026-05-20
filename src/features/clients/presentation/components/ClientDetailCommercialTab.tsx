/**
 * Bloque de términos comerciales en el tab Información del detalle de cliente.
 */

import type { ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
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
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4 shrink-0 text-primary" />
          Términos comerciales
        </CardTitle>
        <CardDescription>Forma de pago y condiciones de crédito.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
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
  );
}
