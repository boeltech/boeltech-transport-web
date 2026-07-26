import { Outlet } from "react-router-dom";

import { AuthFunnelShell } from "@pages/auth/AuthFunnelShell";

/**
 * AuthLayout — chrome del embudo público (login, registro, recuperación).
 * Query/Theme/Toast viven en App.tsx. Sin AuthProvider (sesión en AppLayout).
 */
const AuthLayout = () => {
  return (
    <AuthFunnelShell>
      <Outlet />
    </AuthFunnelShell>
  );
};

export default AuthLayout;
