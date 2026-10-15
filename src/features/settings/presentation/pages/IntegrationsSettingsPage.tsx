/**
 * IntegrationsSettingsPage
 *
 * Placeholder fuera del nav (ruta legacy). Sin promesa de roadmap.
 */

import { memo } from "react";
import { Plug } from "lucide-react";
import { EmptyState } from "@shared/ui/feedback-states";
import { SettingsPageShell } from "@shared/ui/page-shells";

export const IntegrationsSettingsPage = memo(
  function IntegrationsSettingsPage() {
    return (
      <SettingsPageShell
        sectionTitle="Integraciones"
        title="Integraciones"
        description="Conexiones con servicios externos."
      >
        <EmptyState
          icon={<Plug className="h-10 w-10 text-muted-foreground" />}
          title="Integraciones no disponibles"
          description="Esta sección aún no está habilitada en tu empresa."
        />
      </SettingsPageShell>
    );
  },
);
