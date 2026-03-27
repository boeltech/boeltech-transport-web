/**
 * IntegrationsSettingsPage
 *
 * Página de configuración de integraciones (placeholder).
 *
 * Ubicación: src/features/settings/ui/pages/IntegrationsSettingsPage.tsx
 */

import { memo } from "react";
import { Plug, Webhook, Globe, Zap } from "lucide-react";
import { SettingsLayout } from "../components/SettingsLayout";
import { Badge } from "@shared/ui/badge";

// ============================================================================
// COMPONENT
// ============================================================================

export const IntegrationsSettingsPage = memo(
  function IntegrationsSettingsPage() {
    return (
      <SettingsLayout sectionTitle="Integraciones">
        <div className="space-y-6">
          {/* Coming Soon Banner */}
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Próximamente</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Las integraciones con servicios externos estarán disponibles
              pronto. Podrás conectar con APIs de rastreo GPS, sistemas
              contables y más.
            </p>
          </div>

          {/* Preview of upcoming features */}
          <div className="grid gap-4 sm:grid-cols-2">
            <IntegrationPreview
              icon={Globe}
              title="API REST"
              description="Conecta sistemas externos con nuestra API"
              status="En desarrollo"
            />
            <IntegrationPreview
              icon={Webhook}
              title="Webhooks"
              description="Recibe notificaciones en tiempo real"
              status="Planeado"
            />
            <IntegrationPreview
              icon={Zap}
              title="Rastreo GPS"
              description="Integración con proveedores de telemetría"
              status="Planeado"
            />
            <IntegrationPreview
              icon={Plug}
              title="Sistemas contables"
              description="Sincroniza con CONTPAQi, SAP, etc."
              status="Planeado"
            />
          </div>
        </div>
      </SettingsLayout>
    );
  },
);

// ============================================================================
// INTEGRATION PREVIEW
// ============================================================================

interface IntegrationPreviewProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: string;
}

const IntegrationPreview = memo(function IntegrationPreview({
  icon: Icon,
  title,
  description,
  status,
}: IntegrationPreviewProps) {
  return (
    <div className="rounded-lg border p-4 opacity-60">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{title}</h3>
            <Badge variant="outline" className="text-xs">
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
});
