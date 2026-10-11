import { Link, useLocation } from "react-router-dom";
import { Mail, TicketPlus } from "lucide-react";
import config from "@shared/config/env";
import { Button } from "@shared/ui/button";
import { BRAND } from "@shared/ui/brand";
import { useAuth } from "@/shared/hooks/useAuth";
import { buildSupportMailto } from "@widgets/header/lib/buildSupportMailto";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.ticketsPaused;
const panelCopy = helpCenterCopy.panel;

/**
 * UI 200 de pausa para deep links `/ayuda/tickets` y `/ayuda/tickets/:id`
 * cuando `config.help.ticketsEnabled` es false. Escape = mailto únicamente.
 */
export function HelpTicketsPausedView() {
  const location = useLocation();
  const { user } = useAuth();

  const mailtoHref = buildSupportMailto({
    supportEmail: config.support.email,
    productName: config.app.name || BRAND.productName,
    tenantName: user?.tenant?.name,
    userEmail: user?.email,
    currentPath: `${location.pathname}${location.search}`,
    environment: config.observability.environment,
    release: config.observability.release,
  });

  return (
    <div
      className="flex flex-col items-center justify-center py-12"
      data-testid="help-tickets-paused"
    >
      <div className="mb-4 text-muted-foreground/50 [&_svg]:h-16 [&_svg]:w-16">
        <TicketPlus />
      </div>
      <h1 className="mb-2 text-center text-xl font-semibold">{copy.title}</h1>
      <p className="mb-2 max-w-md text-center text-muted-foreground">
        {copy.deepLink}
      </p>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        {copy.description}
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild>
          <a href={mailtoHref}>
            <Mail className="mr-2 h-4 w-4" />
            {panelCopy.contactByEmail}
          </a>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/ayuda">{copy.backToHelp}</Link>
        </Button>
      </div>
    </div>
  );
}
