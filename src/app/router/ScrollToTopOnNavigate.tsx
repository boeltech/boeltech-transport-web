/**
 * Reinicia el scroll al cambiar de ruta (SPA).
 * Sin esto, al volver a /welcome desde /login el window.scrollY
 * puede quedar a mitad del hero y el chrome (relative) desaparece.
 * Respeta hashes (#pricing, #evidencia) para anclas in-page.
 */
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

let scrollRestorationPinned = false;

function pinManualScrollRestoration() {
  if (scrollRestorationPinned) return;
  if (typeof window === "undefined") return;
  if (!("scrollRestoration" in window.history)) return;
  window.history.scrollRestoration = "manual";
  scrollRestorationPinned = true;
}

export function ScrollToTopOnNavigate() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    pinManualScrollRestoration();
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}

export default ScrollToTopOnNavigate;
