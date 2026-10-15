// VERSIÓN SIMPLIFICADA - Sin llamada API

import { Navigate } from "react-router-dom";
import { tokenStorage } from "@features/auth";

/**
 * RootRedirect (Versión Simplificada)
 *
 * Componente que maneja la ruta raíz ("/").
 *
 * Estrategia:
 * - Si hay marcador de sesión (`hasSession`, paridad PrivateRoute) → Dashboard
 * - Si no → welcome / funnel
 *
 * En modo cookies no hay access token en localStorage; `hasSession` usa `erp_user`.
 * La validación real la hace PrivateRoute/AuthProvider en el destino.
 */
const RootRedirect = () => {
  const hasSession = tokenStorage.hasSession();

  if (hasSession) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/welcome" replace />;
};

export default RootRedirect;
