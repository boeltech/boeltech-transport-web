// VERSIÓN SIMPLIFICADA - Sin llamada API

import { Navigate } from "react-router-dom";
import { tokenStorage } from "@features/auth/lib/tokenStorage";

/**
 * RootRedirect (Versión Simplificada)
 *
 * Componente que maneja la ruta raíz ("/").
 *
 * Estrategia:
 * - Si hay token → asume autenticado → Dashboard
 * - Si no hay token → Login
 *
 * La validación real del token la hace PrivateRoute/AuthProvider
 * cuando el usuario llegue al Dashboard. Si el token es inválido,
 * será redirigido a Login desde ahí.
 *
 * Ventajas:
 * - No hace llamada API innecesaria
 * - Redirect instantáneo
 * - La validación real ocurre una sola vez en AuthProvider
 *
 * La Landing Page tiene botones para ir al Login.
 */
const RootRedirect = () => {
  const hasToken = !!tokenStorage.getToken();

  if (hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/welcome" replace />;
};

export default RootRedirect;
