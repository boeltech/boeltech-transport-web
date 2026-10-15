import { useState, useRef, useEffect, useCallback, type RefObject } from "react";
import { escapeHtml } from "@shared/utils/escapeHtml";

export interface UsePrintIframeResult {
  triggerPrint: (documentTitle?: string) => void;
  isPrinting: boolean;
}

/**
 * Hook to print a referenced DOM node via an invisible sandboxed iframe
 * (`sandbox="allow-same-origin allow-modals"` — same-origin for srcdoc access;
 * modals so `contentWindow.print()` can open the print dialog),
 * avoiding popup blockers, window.open security risks, and cross-screen print bugs.
 */
export function usePrintIframe(
  contentRef: RefObject<HTMLElement | null>,
): UsePrintIframeResult {
  const [isPrinting, setIsPrinting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup iframe on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (iframeRef.current && iframeRef.current.parentNode) {
        iframeRef.current.parentNode.removeChild(iframeRef.current);
        iframeRef.current = null;
      }
    };
  }, []);

  const triggerPrint = useCallback(
    (documentTitle?: string) => {
      const contentEl = contentRef.current;
      if (!contentEl) {
        window.print();
        return;
      }

      if (isPrinting) {
        return;
      }

      setIsPrinting(true);

      // Create or reuse hidden iframe
      let iframe = iframeRef.current;
      if (!iframe || !iframe.parentNode) {
        iframe = document.createElement("iframe");
        iframe.setAttribute("aria-hidden", "true");
        // allow-same-origin: parent can read contentWindow after srcdoc inject.
        // allow-modals: required for contentWindow.print() dialog in Chromium.
        iframe.setAttribute("sandbox", "allow-same-origin allow-modals");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }

      // Collect same-origin or inline styles
      const styleNodes = Array.from(
        document.querySelectorAll("style, link[rel='stylesheet']"),
      );

      const stylesMarkup = styleNodes
        .map((node) => {
          if (node.tagName.toLowerCase() === "link") {
            const href = (node as HTMLLinkElement).href;
            // Only allow same-origin stylesheet links
            if (href && (href.startsWith(window.location.origin) || href.startsWith("/"))) {
              return node.outerHTML;
            }
            return "";
          }
          return node.outerHTML;
        })
        .filter(Boolean)
        .join("\n");

      const rawHtml = contentEl.outerHTML;
      // Chromium "Guardar como PDF" often uses the *parent* document.title (app = "tlamx"),
      // not the iframe <title>. Keep both in sync and restore after print.
      const plainTitle = documentTitle?.trim() || "Impresión";
      const safeTitle = escapeHtml(plainTitle);

      const htmlDocument = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    ${stylesMarkup}
    <style>
      @page {
        size: letter portrait;
        margin: 10mm;
      }
      body {
        background-color: white !important;
        color: black !important;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    </style>
  </head>
  <body>
    ${rawHtml}
  </body>
</html>`;

      const performPrint = () => {
        const previousTitle = document.title;
        let restored = false;
        const restoreTitle = () => {
          if (restored) return;
          restored = true;
          document.title = previousTitle;
          window.removeEventListener("afterprint", restoreTitle);
          iframe?.contentWindow?.removeEventListener("afterprint", restoreTitle);
        };

        try {
          document.title = plainTitle;
          const win = iframe?.contentWindow;
          if (win) {
            win.addEventListener("afterprint", restoreTitle);
            window.addEventListener("afterprint", restoreTitle);
            win.focus();
            win.print();
          } else {
            restoreTitle();
          }
        } catch {
          restoreTitle();
          window.print();
        } finally {
          setIsPrinting(false);
          // print() returns before Save-as closes; afterprint restores title.
          // Safety net if afterprint never fires (some embedded WebViews).
          setTimeout(restoreTitle, 60_000);
        }
      };

      iframe.onload = () => {
        // Short buffer to ensure layout/fonts are applied
        setTimeout(performPrint, 100);
      };

      // Set fallback safety timeout to avoid stuck isPrinting
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setIsPrinting(false);
      }, 5000);

      // Inject HTML via srcdoc (standard and safe in modern browsers)
      iframe.srcdoc = htmlDocument;
    },
    [contentRef, isPrinting],
  );

  return { triggerPrint, isPrinting };
}
