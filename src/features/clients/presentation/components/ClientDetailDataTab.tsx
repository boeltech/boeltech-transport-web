/**
 * Tab "Información" del detalle de cliente — fiscal, contacto y notas.
 * Layout alineado a VehicleDetailPage / DriverDetailPage (cards en grid).
 */

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { FileText, User, Star } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { Client } from "../../domain";
import { CLIENT_CONTACT_ROLE_LABELS } from "../../domain";
import { clientDetailCopy } from "../copy/clientDetailCopy";

interface ClientDetailDataTabProps {
  client: Client;
  taxRegimeLabel: string | null;
  /** Navega al tab Contactos (CTA cuando no hay principal). */
  onGoToContacts?: () => void;
  /** Tercera columna (términos comerciales). Si se omite, layout 2 columnas. */
  commercialSection?: ReactNode;
}

const copy = clientDetailCopy.primaryContact;

function primaryContactRoles(client: Client): string[] {
  const contact = client.primaryContact;
  if (!contact) return [];
  const roles: string[] = [];
  if (contact.signsCartaPorte) roles.push(CLIENT_CONTACT_ROLE_LABELS.signsCartaPorte);
  if (contact.receivesInvoices) roles.push(CLIENT_CONTACT_ROLE_LABELS.receivesInvoices);
  if (contact.authorizesPayments) roles.push(CLIENT_CONTACT_ROLE_LABELS.authorizesPayments);
  return roles;
}

export function ClientDetailDataTab({
  client,
  taxRegimeLabel,
  onGoToContacts,
  commercialSection,
}: ClientDetailDataTabProps) {
  const primary = client.primaryContact;
  const roles = primaryContactRoles(client);
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
          </CardContent>
        </Card>

        <Card className={cn(threeCol && "flex h-full flex-col")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 shrink-0 text-primary" />
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-0", threeCol && "flex-1")}>
            {primary ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    Principal
                  </Badge>
                  {roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
                <InfoRow variant="inline" label="Nombre" value={primary.fullName} />
                {primary.position ? (
                  <InfoRow variant="inline" label="Puesto" value={primary.position} />
                ) : null}
                {primary.phone ? (
                  <InfoRow
                    variant="inline"
                    label="Teléfono"
                    value={
                      <a href={`tel:${primary.phone}`} className="text-primary hover:underline">
                        {primary.phone}
                      </a>
                    }
                  />
                ) : null}
                {primary.secondaryPhone ? (
                  <InfoRow
                    variant="inline"
                    label="Teléfono secundario"
                    value={
                      <a
                        href={`tel:${primary.secondaryPhone}`}
                        className="text-primary hover:underline"
                      >
                        {primary.secondaryPhone}
                      </a>
                    }
                  />
                ) : null}
                {primary.email ? (
                  <InfoRow
                    variant="inline"
                    label="Correo"
                    value={
                      <a href={`mailto:${primary.email}`} className="text-primary hover:underline">
                        {primary.email}
                      </a>
                    }
                  />
                ) : null}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{copy.empty}</p>
                {onGoToContacts ? (
                  <Button type="button" variant="outline" size="sm" onClick={onGoToContacts}>
                    {copy.cta}
                  </Button>
                ) : null}
              </div>
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
