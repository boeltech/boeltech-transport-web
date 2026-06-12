/**
 * Refetch intervals for React Query — disabled in dev when VITE_DISABLE_DEV_POLLING=true.
 */
export function devRefetchIntervalMs(
  intervalMs: number | false,
): number | false {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_DISABLE_DEV_POLLING === "true"
  ) {
    return false;
  }
  return intervalMs;
}

export function devRefetchIntervalFn<T>(
  resolver: (state: T) => number | false,
): (state: T) => number | false {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_DISABLE_DEV_POLLING === "true"
  ) {
    return () => false;
  }
  return resolver;
}
