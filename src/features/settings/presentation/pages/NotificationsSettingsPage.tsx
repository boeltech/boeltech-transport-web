/**
 * NotificationsSettingsPage
 *
 * Página de configuración de notificaciones.
 *
 * Ubicación: src/features/settings/ui/pages/NotificationsSettingsPage.tsx
 */

import { memo } from "react";
import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { NotificationSettingsForm } from "../components/NotificationSettingsForm";

// ============================================================================
// COMPONENT
// ============================================================================

export const NotificationsSettingsPage = memo(
  function NotificationsSettingsPage() {
    return (
      <SettingsPageShell sectionTitle="Notificaciones">
        <NotificationSettingsForm />
      </SettingsPageShell>
    );
  },
);
