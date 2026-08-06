import { Outlet } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { PlatformAuthProvider } from "../providers/PlatformAuthProvider";
import { PlatformMfaEnrollmentGate } from "../providers/PlatformMfaEnrollmentGate";
import {
  PlatformSidebarProvider,
  usePlatformSidebar,
} from "../providers/PlatformSidebarProvider";
import { PlatformHeader } from "./PlatformHeader";
import { PlatformMobileSidebar } from "./PlatformMobileSidebar";
import { PlatformSidebar } from "./PlatformSidebar";

export function PlatformShell() {
  return (
    <PlatformAuthProvider>
      <PlatformSidebarProvider>
        <PlatformMfaEnrollmentGate>
          <PlatformShellLayout />
        </PlatformMfaEnrollmentGate>
      </PlatformSidebarProvider>
    </PlatformAuthProvider>
  );
}

function PlatformShellLayout() {
  const { isCollapsed } = usePlatformSidebar();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen transition-all duration-300 ease-in-out lg:block">
        <PlatformSidebar />
      </aside>

      <PlatformMobileSidebar />
      <PlatformHeader />

      <main className="min-h-screen transition-all duration-300 ease-in-out">
        <div
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out",
            isCollapsed ? "lg:ml-[70px]" : "lg:ml-[260px]",
          )}
        >
          <div className="px-4 pb-4 pt-20 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
