/**
 * Tab "Información" del detalle de cliente — fiscal, contacto y notas.
 * Layout alineado a VehicleDetailPage / DriverDetailPage (cards en grid).
 */

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { FileText, User } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { Client } from "../../domain";

interface ClientDetailDataTabProps {
  client: Client;
  taxRegimeLabel: string | null;
  /** Tercera columna (términos comerciales). Si se omite, layout 2 columnas. */
  commercialSection?: ReactNode;
}

export function ClientDetailDataTab({
  client,
  taxRegimeLabel,
  commercialSection,
}: ClientDetailDataTabProps) {
  const hasContact =
    client.contactName ||
    client.contactPosition ||
    client.phone ||
    client.secondaryPhone ||
    client.email ||
    client.billingEmail;

  const threeCol = Boolean(commercialSection);

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          threeCol ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        <Card className={cn(threeCol && "flex h-full flex-col")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              Información fiscal
            </CardTitle>
            <CardDescription>Razón social, RFC y régimen para facturación.</CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-0", threeCol && "flex-1")}>
            <InfoRow variant="inline" label="Razón social" value={client.legalName} />
            {client.tradeName ? (
              <InfoRow variant="inline" label="Nombre comercial" value={client.tradeName} />
            ) : null}
            <InfoRow variant="inline" label="RFC" value={client.taxId} mono copyable />
            {taxRegimeLabel ? (
              <InfoRow variant="inline" label="Régimen fiscal" value={taxRegimeLabel} />
            ) : null}
          </CardContent>
        </Card>

        <Card className={cn(threeCol && "flex h-full flex-col")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 shrink-0 text-primary" />
              Contacto principal
            </CardTitle>
            <CardDescription>Persona y canales de comunicación del cliente.</CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-0", threeCol && "flex-1")}>
            {hasContact ? (
              <>
                {client.contactName ? (
                  <InfoRow variant="inline" label="Nombre" value={client.contactName} />
                ) : null}
                {client.contactPosition ? (
                  <InfoRow variant="inline" label="Puesto" value={client.contactPosition} />
                ) : null}
                {client.phone ? (
                  <InfoRow
                    variant="inline"
                    label="Teléfono"
                    value={
                      <a
                        href={`tel:${client.phone}`}
                        className="text-primary hover:underline"
                      >
                        {client.phone}
                      </a>
                    }
                  />
                ) : null}
                {client.secondaryPhone ? (
                  <InfoRow
                    variant="inline"
                    label="Teléfono secundario"
                    value={
                      <a
                        href={`tel:${client.secondaryPhone}`}
                        className="text-primary hover:underline"
                      >
                        {client.secondaryPhone}
                      </a>
                    }
                  />
                ) : null}
                {client.email ? (
                  <InfoRow
                    variant="inline"
                    label="Correo"
                    value={
                      <a
                        href={`mailto:${client.email}`}
                        className="text-primary hover:underline"
                      >
                        {client.email}
                      </a>
                    }
                  />
                ) : null}
                {client.billingEmail ? (
                  <InfoRow
                    variant="inline"
                    label="Correo de facturación"
                    value={
                      <a
                        href={`mailto:${client.billingEmail}`}
                        className="text-primary hover:underline"
                      >
                        {client.billingEmail}
                      </a>
                    }
                  />
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay información de contacto registrada.
              </p>
            )}
          </CardContent>
        </Card>

        {commercialSection ? (
          <div className="flex min-w-0 w-full flex-col">{commercialSection}</div>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            Notas
          </CardTitle>
          <CardDescription>Observaciones internas sobre el cliente.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {client.notes ? (
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin notas</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
