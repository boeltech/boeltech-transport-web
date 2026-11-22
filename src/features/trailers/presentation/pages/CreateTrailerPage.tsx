/**
 * CreateTrailerPage — redirect legacy /trailers/new → listado + sheet.
 *
 * N/A FormPageShell / migas (B-U03): el alta vive en TrailerCatalogSheet
 * (Navigate → `?create=true`), no en un form de página completa.
 */

import { Navigate } from "react-router-dom";
import { trailerCatalogListHref } from "../trailerCatalogSheetParams";

export function CreateTrailerPage() {
  return <Navigate to={trailerCatalogListHref({ create: true })} replace />;
}
