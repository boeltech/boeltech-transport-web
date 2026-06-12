import { useCallback } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@shared/hooks";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

export function CopyableUuidSubtitle({ uuid }: { uuid: string }) {
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(uuid);
      toast({ title: copy.toast.copied });
    } catch {
      toast({
        title: copy.toast.copyFailed,
        variant: "destructive",
      });
    }
  }, [toast, uuid]);

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span>{copy.header.uuidLabel}: </span>
      <span className="font-mono">{uuid}</span>
      <span
        role="button"
        tabIndex={0}
        className="inline-flex cursor-pointer items-center text-foreground/70 hover:text-foreground"
        onClick={() => void handleCopy()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void handleCopy();
          }
        }}
        aria-label="Copiar UUID"
      >
        <Copy className="h-3.5 w-3.5" />
      </span>
    </span>
  );
}
