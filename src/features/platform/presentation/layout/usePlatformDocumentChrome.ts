import { useLayoutEffect } from "react";
import { opsCopy } from "../ops/opsCopy";

/** Favicon de consola. No es el portal de tlamx (`/favicon.svg`). */
export const PLATFORM_CONSOLE_FAVICON_HREF = "/platform-console-favicon.svg";

/** Meta description mientras la ruta es de consola. El pitch de tlamx vive en `index.html`. */
export const PLATFORM_CONSOLE_META_DESCRIPTION =
  "Consola de operadores Boeltech. Acceso distinto al de las empresas en tlamx.";

/**
 * Nombre de la pestaña en `/platform` y `/platform/login`.
 * Wordmark visible de OpsBrandMark (`opsCopy.wordmark`; el monograma es decorativo).
 */
export function platformConsoleDocumentTitle(): string {
  return opsCopy.wordmark;
}

function iconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]');
}

function descriptionMeta(): HTMLMetaElement | null {
  return document.querySelector<HTMLMetaElement>('meta[name="description"]');
}

/**
 * Mientras la consola está montada, la pestaña y el favicon nombran este
 * mundo. Al salir de `/platform` se restaura lo que tenía el ERP. Si el
 * cleanup corre y la ruta sigue bajo `/platform` (login → shell), no se
 * restaura: evita el instante en que la pestaña vuelve a decir tlamx.
 */
export function usePlatformDocumentChrome(): void {
  const title = platformConsoleDocumentTitle();

  useLayoutEffect(() => {
    const previousTitle = document.title;
    const link = iconLink();
    const previousHref = link?.getAttribute("href") ?? null;
    const previousType = link?.getAttribute("type") ?? null;
    const created = link == null;
    const target = link ?? document.createElement("link");

    if (created) {
      target.rel = "icon";
      document.head.appendChild(target);
    }

    const meta = descriptionMeta();
    const createdMeta = meta == null;
    const metaEl = meta ?? document.createElement("meta");
    if (createdMeta) {
      metaEl.setAttribute("name", "description");
      document.head.appendChild(metaEl);
    }
    const previousDescription = metaEl.getAttribute("content");

    document.title = title;
    target.setAttribute("href", PLATFORM_CONSOLE_FAVICON_HREF);
    target.setAttribute("type", "image/svg+xml");
    metaEl.setAttribute("content", PLATFORM_CONSOLE_META_DESCRIPTION);

    return () => {
      if (window.location.pathname.startsWith("/platform")) return;

      document.title = previousTitle;
      if (created) {
        target.remove();
      } else {
        if (previousHref != null) target.setAttribute("href", previousHref);
        if (previousType != null) target.setAttribute("type", previousType);
      }
      if (createdMeta) {
        metaEl.remove();
      } else if (previousDescription != null) {
        metaEl.setAttribute("content", previousDescription);
      }
    };
  }, [title]);
}
