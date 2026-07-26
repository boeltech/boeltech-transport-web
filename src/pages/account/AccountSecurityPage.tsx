/**
 * Tab Seguridad — contraseña + MFA + sesiones.
 */

import { UserSecuritySettings } from "@features/settings";
import { PasswordChangeSection } from "./components/PasswordChangeSection";

export function AccountSecurityPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PasswordChangeSection />
      <UserSecuritySettings />
    </div>
  );
}

export default AccountSecurityPage;
