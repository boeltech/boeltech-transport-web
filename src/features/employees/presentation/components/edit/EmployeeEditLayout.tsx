import type { ReactNode } from "react";

interface EmployeeEditLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function EmployeeEditLayout({ sidebar, children }: EmployeeEditLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {sidebar}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
