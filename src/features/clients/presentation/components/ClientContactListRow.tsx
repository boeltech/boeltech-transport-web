/**
 * ClientContactListRow — fila compacta en master-detail de contactos
 */

import { Star, User } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import type { ClientContact } from "../../domain";
import { CLIENT_CONTACT_ROLE_LABELS } from "../../domain";

export interface ClientContactListRowProps {
  contact: ClientContact;
  selected?: boolean;
  onClick: () => void;
  className?: string;
}

function activeRoles(contact: ClientContact): string[] {
  const roles: string[] = [];
  if (contact.signsCartaPorte) {
    roles.push(CLIENT_CONTACT_ROLE_LABELS.signsCartaPorte);
  }
  if (contact.receivesInvoices) {
    roles.push(CLIENT_CONTACT_ROLE_LABELS.receivesInvoices);
  }
  if (contact.authorizesPayments) {
    roles.push(CLIENT_CONTACT_ROLE_LABELS.authorizesPayments);
  }
  return roles;
}

export function ClientContactListRow({
  contact,
  selected = false,
  onClick,
  className,
}: ClientContactListRowProps) {
  const roles = activeRoles(contact);
  const subtitle = [contact.position, contact.phone ?? contact.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-md border p-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-background shadow-sm"
          : "border-transparent bg-card hover:border-border",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{contact.fullName}</p>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {contact.isPrimary ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                Principal
              </Badge>
            ) : null}
            {roles.slice(0, 2).map((role) => (
              <Badge key={role} variant="outline" className="h-5 px-1.5 text-[10px]">
                {role}
              </Badge>
            ))}
          </div>
        </div>
        {contact.isPrimary ? (
          <Star
            className="h-3.5 w-3.5 shrink-0 fill-warning text-warning"
            aria-label="Contacto principal"
          />
        ) : null}
      </div>
    </button>
  );
}

export default ClientContactListRow;
