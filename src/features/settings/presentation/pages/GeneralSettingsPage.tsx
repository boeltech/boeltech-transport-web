/**
 * GeneralSettingsPage
 *
 * Página de configuración general de la empresa.
 * Incluye datos fiscales, dirección y logo.
 *
 * Ubicación: src/features/settings/ui/pages/GeneralSettingsPage.tsx
 */

import { memo } from "react";
import { SettingsLayout } from "../components/SettingsLayout";
import { LogoUpload } from "../components/LogoUpload";
import { CompanySettingsForm } from "../components/CompanySettingsForm";

// ============================================================================
// COMPONENT
// ============================================================================

export const GeneralSettingsPage = memo(function GeneralSettingsPage() {
  return (
    <SettingsLayout sectionTitle="General">
      <div className="space-y-6">
        {/* Logo */}
        <LogoUpload />

        {/* Company Form */}
        <CompanySettingsForm />
      </div>
    </SettingsLayout>
  );
});
