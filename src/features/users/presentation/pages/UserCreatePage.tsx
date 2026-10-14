/**
 * D10 (Ola 4 #1): alta canónica = `AddUserSheet` en `/users`.
 * Elección: redirect a `?create=1` (barato; el listado ya monta el Sheet)
 * en lugar de FormPageShell + post-create → detalle.
 */
import { Navigate } from "react-router-dom";
import { usersCreatePath } from "../utils/userWayfinding";

export function UserCreatePage() {
  return <Navigate to={usersCreatePath()} replace />;
}
