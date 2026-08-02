/**
 * Tab "Cliente" del detalle — identificación, contacto principal (teaser) y notas.
 */

import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { FileText, User, Star } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { Client } from "../../domain";
import { clientDetailCopy } from "../copy/clientDetailCopy";

interface ClientDetailDataTabProps {
  client: Client;
  taxRegimeLabel: string | null;
  /** Navega al tab Contactos (CTA cuando no hay principal o para ver ficha completa). */
  onGoToContacts?: () => void;
  /** Tercera columna (términos comerciales). Si se omite, layout 2 columnas. */
  commercialSection?: ReactNode;
}

const idCopy = clientDetailCopy.identification;
const contactCopy = clientDetailCopy.primaryContact;
const notesCopy = clientDetailCopy.notes;

export function ClientDetailDataTab({
  client,
  taxRegimeLabel,
  onGoToContacts,
  commercialSection,
}: ClientDetailDataTabProps) {
  const primary = client.primaryContact;
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
              {idCopy.title}
            </CardTitle>
            <CardDescription>{idCopy.description}</CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-0", threeCol && "flex-1")}>
            <InfoRow variant="inline" label={idCopy.legalName} value={client.legalName} />
            {client.tradeName ? (
              <InfoRow variant="inline" label={idCopy.tradeName} value={client.tradeName} />
            ) : null}
            <InfoRow variant="inline" label={idCopy.taxId} value={client.taxId} mono copyable />
            {taxRegimeLabel ? (
              <InfoRow variant="inline" label={idCopy.taxRegime} value={taxRegimeLabel} />
            ) : null}
            {client.billingEmail ? (
              <InfoRow
                variant="inline"
                label={idCopy.billingEmail}
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
              {contactCopy.title}
            </CardTitle>
            <CardDescription>{contactCopy.description}</CardDescription>
          </CardHeader>
          <CardContent className={cn("pt-0 space-y-3", threeCol && "flex-1")}>
            {primary ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    Principal
                  </Badge>
                </div>
                <p className="text-sm font-medium">{primary.fullName}</p>
                {onGoToContacts ? (
                  <Button type="button" variant="outline" size="sm" onClick={onGoToContacts}>
                    {contactCopy.viewInContacts}
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{contactCopy.empty}</p>
                {onGoToContacts ? (
                  <Button type="button" variant="outline" size="sm" onClick={onGoToContacts}>
                    {contactCopy.cta}
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
            {notesCopy.title}
          </CardTitle>
          <CardDescription>{notesCopy.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {client.notes ? (
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{notesCopy.empty}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
