/** Riel activo 3px — `sidebar-primary` (ámbar en paleta Patio). */
export function PlatformNavActiveRail({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span
      aria-hidden
      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-sidebar-primary"
    />
  );
}
