import type { ReactNode } from "react";
import { Receipt } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";

interface InvoiceFormPageShellProps {
  isLoading?: boolean;
  backHref: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function InvoiceFormPageShell({
  isLoading = false,
  backHref,
  title,
  subtitle,
  children,
}: InvoiceFormPageShellProps) {
  return (
    <FormPageShell
      isLoading={isLoading}
      header={{
        backHref,
        backLabel: "Volver",
        icon: <Receipt className="h-5 w-5" />,
        title,
        subtitle,
      }}
    >
      {!isLoading ? <div className="max-w-3xl">{children}</div> : null}
    </FormPageShell>
  );
}
