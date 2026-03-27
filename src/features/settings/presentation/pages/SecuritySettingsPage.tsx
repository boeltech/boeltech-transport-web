/**
 * SecuritySettingsPage
 *
 * Página de configuración de seguridad (placeholder).
 *
 * Ubicación: src/features/settings/ui/pages/SecuritySettingsPage.tsx
 */

import { memo } from "react";
import { Shield, Lock, Key, Smartphone } from "lucide-react";
import { SettingsLayout } from "../components/SettingsLayout";
import { SettingsCard } from "../components/SettingsLayout";
import { Badge } from "@shared/ui/badge";

// ============================================================================
// COMPONENT
// ============================================================================

export const SecuritySettingsPage = memo(function SecuritySettingsPage() {
  return (
    <SettingsLayout sectionTitle="Seguridad">
      <div className="space-y-6">
        {/* Coming Soon Banner */}
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Próximamente</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            La configuración de seguridad estará disponible pronto. Podrás
            gestionar políticas de contraseñas, autenticación de dos factores y
            más.
          </p>
        </div>

        {/* Preview of upcoming features */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FeaturePreview
            icon={Lock}
            title="Políticas de contraseñas"
            description="Configura requisitos mínimos de complejidad y caducidad"
          />
          <FeaturePreview
            icon={Smartphone}
            title="Autenticación de dos factores"
            description="Añade una capa extra de seguridad con 2FA"
          />
          <FeaturePreview
            icon={Key}
            title="Sesiones activas"
            description="Visualiza y cierra sesiones en otros dispositivos"
          />
          <FeaturePreview
            icon={Shield}
            title="Registro de actividad"
            description="Historial de acciones sensibles en el sistema"
          />
        </div>
      </div>
    </SettingsLayout>
  );
});

// ============================================================================
// FEATURE PREVIEW
// ============================================================================

interface FeaturePreviewProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FeaturePreview = memo(function FeaturePreview({
  icon: Icon,
  title,
  description,
}: FeaturePreviewProps) {
  return (
    <div className="rounded-lg border p-4 opacity-60">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{title}</h3>
            <Badge variant="secondary" className="text-xs">
              Próximamente
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
});
