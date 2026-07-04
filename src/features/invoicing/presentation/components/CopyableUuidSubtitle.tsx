import { useCallback } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@shared/hooks";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

function formatUuidForDisplay(uuid: string): string {
  if (uuid.length <= 24) return uuid;
  return `${uuid.slice(0, 8)}…${uuid.slice(-8)}`;
}

interface CopyableUuidSubtitleProps {
  uuid: string;
  label?: string;
  copyAriaLabel?: string;
  size?: "sm" | "default";
}

export function CopyableUuidSubtitle({
  uuid,
  label = copy.header.uuidLabel,
  copyAriaLabel = copy.header.uuidCopyLabel,
  size = "default",
}: CopyableUuidSubtitleProps) {
  const { toast } = useToast();
  const textSizeClass =
    size === "sm" ? "text-xs" : "text-xs sm:text-sm";

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
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={`min-w-0 font-mono ${textSizeClass}`}
        title={uuid}
      >
        <span className="hidden lg:inline truncate max-w-md">{uuid}</span>
        <span className="lg:hidden">{formatUuidForDisplay(uuid)}</span>
      </span>
      <button
        type="button"
        className="inline-flex shrink-0 items-center text-foreground/70 hover:text-foreground"
        onClick={() => void handleCopy()}
        aria-label={copyAriaLabel}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}
