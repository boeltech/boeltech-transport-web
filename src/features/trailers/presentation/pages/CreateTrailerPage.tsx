/**
 * CreateTrailerPage — redirect legacy /trailers/new → listado + sheet.
 */

import { Navigate } from "react-router-dom";
import { trailerCatalogListHref } from "../trailerCatalogSheetParams";

export function CreateTrailerPage() {
  return <Navigate to={trailerCatalogListHref({ create: true })} replace />;
}
