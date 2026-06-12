/**
 * ClientContactDetailView — panel read-only del contacto seleccionado
 */

import { Pencil, Star, Trash2, User } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import type { ClientContact } from "../../domain";
import { CLIENT_CONTACT_ROLE_LABELS } from "../../domain";

export interface ClientContactDetailViewProps {
  contact: ClientContact;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetPrimary?: () => void;
  isPending?: boolean;
  className?: string;
}

function roleBadges(contact: ClientContact) {
  const entries: { key: keyof typeof CLIENT_CONTACT_ROLE_LABELS; active: boolean }[] =
    [
      { key: "signsCartaPorte", active: contact.signsCartaPorte },
      { key: "receivesInvoices", active: contact.receivesInvoices },
      { key: "authorizesPayments", active: contact.authorizesPayments },
    ];
  return entries.filter((entry) => entry.active);
}

export function ClientContactDetailView({
  contact,
  readOnly = false,
  onEdit,
  onDelete,
  onSetPrimary,
  isPending = false,
  className,
}: ClientContactDetailViewProps) {
  const roles = roleBadges(contact);
  const showActions = !readOnly && Boolean(onEdit && onDelete);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{contact.fullName}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {contact.isPrimary ? (
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  Principal
                </Badge>
              ) : null}
              {roles.map(({ key }) => (
                <Badge key={key} variant="secondary">
                  {CLIENT_CONTACT_ROLE_LABELS[key]}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {showActions ? (
          <div className="flex flex-wrap items-center gap-2">
            {!contact.isPrimary && onSetPrimary ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSetPrimary}
                disabled={isPending}
              >
                <Star className="mr-1.5 h-3.5 w-3.5" />
                Marcar principal
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={isPending}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        ) : null}
      </header>

      <div className="space-y-0">
        {contact.position ? (
          <InfoRow variant="inline" label="Puesto" value={contact.position} />
        ) : null}
        {contact.phone ? (
          <InfoRow
            variant="inline"
            label="Teléfono"
            value={
              <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                {contact.phone}
              </a>
            }
          />
        ) : null}
        {contact.secondaryPhone ? (
          <InfoRow
            variant="inline"
            label="Teléfono secundario"
            value={
              <a
                href={`tel:${contact.secondaryPhone}`}
                className="text-primary hover:underline"
              >
                {contact.secondaryPhone}
              </a>
            }
          />
        ) : null}
        {contact.email ? (
          <InfoRow
            variant="inline"
            label="Correo"
            value={
              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                {contact.email}
              </a>
            }
          />
        ) : null}
        {contact.notes ? (
          <InfoRow variant="inline" label="Notas" value={contact.notes} />
        ) : null}
      </div>
    </div>
  );
}

export default ClientContactDetailView;
