/**
 * Tab "Información" del detalle de cliente — fiscal, contacto y notas.
 * Términos comerciales viven en `ClientDetailCommercialTab`.
 * Auditoría (`createdAt`/`updatedAt`) está en MetadataFooter del shell.
 *
 * Layout alineado al detalle de empleado: InfoRow variant="inline" + grid lg:2cols.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { FileText, User } from "lucide-react";

import type { Client } from "../../domain";

interface ClientDetailDataTabProps {
  client: Client;
  taxRegimeLabel: string | null;
}

export function ClientDetailDataTab({
  client,
  taxRegimeLabel,
}: ClientDetailDataTabProps) {
  const hasContact =
    client.contactName ||
    client.contactPosition ||
    client.phone ||
    client.secondaryPhone ||
    client.email ||
    client.billingEmail;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Información fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Contacto principal
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notas
            </CardTitle>
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
    </div>
  );
}
