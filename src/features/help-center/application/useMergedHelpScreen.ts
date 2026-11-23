import { useMemo, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { mergeHelpScreenQuery } from "../domain/mergeHelpScreenQuery";
import {
  getHelpScreenExtrasSnapshot,
  subscribeHelpScreenExtras,
  type HelpScreenExtras,
} from "./helpScreenExtrasStore";

function useHelpScreenExtras(): HelpScreenExtras {
  return useSyncExternalStore(
    subscribeHelpScreenExtras,
    getHelpScreenExtrasSnapshot,
    getHelpScreenExtrasSnapshot,
  );
}

/**
 * Runtime `screen` for help match: pathname + search + opaque extras.
 */
export function useMergedHelpScreen(): string {
  const { pathname, search } = useLocation();
  const extras = useHelpScreenExtras();

  return useMemo(() => {
    const hasExtras = Object.keys(extras).length > 0;
    return mergeHelpScreenQuery(
      pathname,
      search,
      hasExtras ? extras : null,
    );
  }, [pathname, search, extras]);
}

/**
 * Fuse an explicit screen string with current opaque extras (empty-state paths).
 */
export function useFusedHelpScreen(screen: string): string {
  const extras = useHelpScreenExtras();

  return useMemo(() => {
    const q = screen.indexOf("?");
    const pathname = q === -1 ? screen : screen.slice(0, q);
    const search = q === -1 ? "" : screen.slice(q);
    const hasExtras = Object.keys(extras).length > 0;
    return mergeHelpScreenQuery(
      pathname,
      search,
      hasExtras ? extras : null,
    );
  }, [screen, extras]);
}
