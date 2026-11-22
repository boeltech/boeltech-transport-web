/**
 * Tab Seguridad — tres paneles (Contraseña, 2FA, Sesiones) · MC7–MC9.
 * Ancho común lo fija AccountShell (MC3).
 */

import { UserSecuritySettings } from "@features/settings";
import { PasswordChangeSection } from "./components/PasswordChangeSection";

export function AccountSecurityPage() {
  return (
    <div className="space-y-6">
      <PasswordChangeSection />
      <UserSecuritySettings />
    </div>
  );
}

export default AccountSecurityPage;
