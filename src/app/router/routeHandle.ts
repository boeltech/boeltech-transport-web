/**
 * Route handle flags consumed by AppLayout / LayoutShell.
 * Attach via `handle: { flush: true }` on a route definition.
 */
export type AppRouteHandle = {
  /**
   * Full-bleed canvas under the app chrome (sidebar + header).
   * Drops content gutters (`px`/`pb`) and `max-w-7xl`.
   */
  flush?: boolean;
};

export function isFlushRouteHandle(
  handle: unknown,
): handle is AppRouteHandle {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "flush" in handle &&
    (handle as AppRouteHandle).flush === true
  );
}
