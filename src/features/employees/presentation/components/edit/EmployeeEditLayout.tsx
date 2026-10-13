/**
 * EmployeeEditLayout — thin adapter over LongFormEditLayout (DS F3).
 */

import type { ReactNode } from "react";
import { LongFormEditLayout } from "@shared/ui/form";

interface EmployeeEditLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function EmployeeEditLayout({ sidebar, children }: EmployeeEditLayoutProps) {
  return (
    <LongFormEditLayout nav={sidebar} contentClassName="space-y-4">
      {children}
    </LongFormEditLayout>
  );
}
