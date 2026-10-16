/**
 * Layout raíz pathless: scroll-to-top en navegación SPA + Outlet de rutas.
 */
import { Outlet } from "react-router-dom";
import { ScrollToTopOnNavigate } from "./ScrollToTopOnNavigate";

export function RootScrollLayout() {
  return (
    <>
      <ScrollToTopOnNavigate />
      <Outlet />
    </>
  );
}

export default RootScrollLayout;
