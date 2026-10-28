import { OpsBrandMark } from "./ui/OpsBrandMark";
import { PlatformOpsNav } from "./PlatformOpsNav";

interface PlatformOpsRailProps {
  pathname: string;
}

export function PlatformOpsRail({ pathname }: PlatformOpsRailProps) {
  return (
    <aside
      data-testid="platform-ops-rail"
      className="ops-bg-rail ops-border fixed left-0 top-0 z-40 hidden h-screen w-[var(--ops-rail-w)] flex-col border-r lg:flex"
      aria-label="Navegación Ops"
    >
      <div className="flex h-[var(--ops-topbar-h)] items-center border-b ops-border px-3">
        <OpsBrandMark showEnv />
      </div>
      <PlatformOpsNav pathname={pathname} />
    </aside>
  );
}
