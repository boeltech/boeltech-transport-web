import { memo, useCallback } from "react";
import { Copy } from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import { useToast } from "@shared/hooks";

interface DetailInfoRowProps {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  copyable?: boolean;
}

export const DetailInfoRow = memo(function DetailInfoRow({
  label,
  value,
  mono = false,
  copyable = false,
}: DetailInfoRowProps) {
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copiado al portapapeles" });
    } catch {
      toast({
        title: "No se pudo copiar",
        variant: "destructive",
      });
    }
  }, [toast, value]);

  return (
    <div className="flex flex-col gap-1 border-b py-2.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <span className="shrink-0 text-xs font-medium tracking-wide text-muted-foreground sm:text-sm">
        {label}
      </span>
      <div className="flex min-w-0 items-start justify-end gap-1.5 sm:gap-2">
        <span
          title={value ?? "—"}
          className={cn(
            "max-w-full break-words text-left text-sm leading-relaxed sm:text-right",
            mono && "font-mono",
            !value && "italic text-muted-foreground",
          )}
        >
          {value ?? "—"}
        </span>
        {copyable && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleCopy}
            aria-label={`Copiar ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
});

