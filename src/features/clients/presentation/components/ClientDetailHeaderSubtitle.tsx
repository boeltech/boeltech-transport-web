/**
 * Subtitle del detalle de cliente: código, tipo, RFC copyable y cue de edición.
 */

import { useCallback } from "react";
import { Copy } from "lucide-react";
import { Button } from "@shared/ui/button";
import { useToast } from "@shared/hooks";
import { copyToClipboard } from "@shared/utils/copyToClipboard";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const copy = clientDetailCopy.header;

export interface ClientDetailHeaderSubtitleProps {
  clientCode: string;
  typeLabel: string;
  rfc: string;
}

export function ClientDetailHeaderSubtitle({
  clientCode,
  typeLabel,
  rfc,
}: ClientDetailHeaderSubtitleProps) {
  const { toast } = useToast();

  const handleCopyRfc = useCallback(async () => {
    const ok = await copyToClipboard(rfc);
    toast(
      ok
        ? { title: copy.rfcCopied, variant: "success" }
        : { title: copy.copyFailed, variant: "destructive" },
    );
  }, [rfc, toast]);

  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        <span className="font-mono">{clientCode}</span>
        <span aria-hidden>·</span>
        <span>{typeLabel}</span>
        {rfc ? (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5">
              <span className="font-mono tracking-wide">{rfc}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopyRfc}
                aria-label={copy.copyRfcAria}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </span>
          </>
        ) : null}
      </div>
      <p className="truncate text-xs text-muted-foreground">{copy.editCue}</p>
    </div>
  );
}
