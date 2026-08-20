import type { ReactNode } from "react";

/** Label operativo + ancla SAT secundaria (Capa 1 D4). */
export function InvoiceDualLabel({
  primary,
  sat,
}: {
  primary: ReactNode;
  sat: string;
}) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0">
      <span>{primary}</span>
      <span className="text-xs font-normal text-muted-foreground">({sat})</span>
    </span>
  );
}
