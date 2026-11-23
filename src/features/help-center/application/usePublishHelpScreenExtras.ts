import { useEffect } from "react";
import {
  publishHelpScreenExtras,
  type HelpScreenExtras,
} from "./helpScreenExtrasStore";

/**
 * Publish opaque help-screen extras for `ownerId` while mounted.
 * Clears on unmount or when `extras` is null.
 */
export function usePublishHelpScreenExtras(
  ownerId: string,
  extras: HelpScreenExtras | null,
): void {
  useEffect(() => {
    publishHelpScreenExtras(ownerId, extras);
    return () => {
      publishHelpScreenExtras(ownerId, null);
    };
  }, [ownerId, extras]);
}
