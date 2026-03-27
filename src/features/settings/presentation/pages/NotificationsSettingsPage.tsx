/**
 * NotificationsSettingsPage
 *
 * Página de configuración de notificaciones.
 *
 * Ubicación: src/features/settings/ui/pages/NotificationsSettingsPage.tsx
 */

import { memo } from "react";
import { SettingsLayout } from "../components/SettingsLayout";
import { NotificationSettingsForm } from "../components/NotificationSettingsForm";

// ============================================================================
// COMPONENT
// ============================================================================

export const NotificationsSettingsPage = memo(
  function NotificationsSettingsPage() {
    return (
      <SettingsLayout sectionTitle="Notificaciones">
        <NotificationSettingsForm />
      </SettingsLayout>
    );
  },
);
