import { useEffect } from "react";

let lockCount = 0;
let previousOverflow: string | undefined;

/**
 * Bloquea el scroll del documento mientras un overlay (Sheet) está abierto.
 * Referencia múltiple para sheets anidados o superpuestos.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    lockCount += 1;
    if (lockCount === 1) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow ?? "";
        previousOverflow = undefined;
      }
    };
  }, [active]);
}
