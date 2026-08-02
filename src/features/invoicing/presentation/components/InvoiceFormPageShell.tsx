import type { ReactNode } from "react";
import { Receipt } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";

interface InvoiceFormPageShellProps {
  isLoading?: boolean;
  backHref: string;
  title: string;
  subtitle?: string;
  /** Badge o acción a la derecha del título (p. ej. alcance de la factura). */
  trailing?: ReactNode;
  children?: ReactNode;
}

export function InvoiceFormPageShell({
  isLoading = false,
  backHref,
  title,
  subtitle,
  trailing,
  children,
}: InvoiceFormPageShellProps) {
  return (
    <FormPageShell
      isLoading={isLoading}
      className="mx-auto w-full max-w-5xl"
      header={{
        backHref,
        backLabel: "Volver",
        icon: <Receipt className="h-5 w-5" />,
        title,
        subtitle,
        trailing,
      }}
    >
      {!isLoading ? <div className="w-full">{children}</div> : null}
    </FormPageShell>
  );
}
