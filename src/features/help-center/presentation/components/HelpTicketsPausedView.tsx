import { useLocation, useNavigate } from "react-router-dom";
import { Mail, TicketPlus } from "lucide-react";
import config from "@shared/config/env";
import { BRAND } from "@shared/ui/brand";
import { EmptyState } from "@shared/ui/feedback-states";
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
  const navigate = useNavigate();
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
    <div data-testid="help-tickets-paused">
      <EmptyState
        icon={<TicketPlus />}
        title={copy.title}
        description={
          <div className="mx-auto max-w-md space-y-2">
            <p>{copy.deepLink}</p>
            <p className="text-sm">{copy.description}</p>
          </div>
        }
        cta={{
          label: panelCopy.contactByEmail,
          icon: <Mail className="h-4 w-4" />,
          onClick: () => {
            window.location.href = mailtoHref;
          },
        }}
        secondaryCta={{
          label: copy.backToHelp,
          onClick: () => navigate("/ayuda"),
          variant: "outline",
        }}
      />
    </div>
  );
}
