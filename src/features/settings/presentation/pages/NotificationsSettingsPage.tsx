/**
 * NotificationsSettingsPage
 *
 * Preferencias de tenant: qué avisos de documentos por vencer llegan a la
 * campana del equipo. Ruta: /settings/notifications.
 */

import { memo } from "react";

import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";

import { NotificationSettingsForm } from "../components/NotificationSettingsForm";
import { notificationSettingsCopy } from "../copy/notificationSettingsCopy";

const copy = notificationSettingsCopy.page;

export const NotificationsSettingsPage = memo(
  function NotificationsSettingsPage() {
    return (
      <SettingsPageShell
        sectionTitle={copy.sectionTitle}
        title={copy.title}
        description={copy.description}
      >
        <NotificationSettingsForm />
      </SettingsPageShell>
    );
  },
);
