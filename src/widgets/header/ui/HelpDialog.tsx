import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { BRAND } from "@shared/ui/brand";
import config from "@shared/config/env";
import { headerCopy } from "../copy/headerCopy";
import { buildSupportMailto } from "../lib/buildSupportMailto";

const copy = headerCopy.help;

export interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | null;
  tenantName?: string | null;
  currentPath: string;
  /** Override de tests / staging; default = config.support.email */
  supportEmail?: string;
  /** Override de tests; default = config.support.helpDocsUrl. Vacío = ocultar. */
  helpDocsUrl?: string;
  environment?: string;
  release?: string;
  productName?: string;
}

export function HelpDialog({
  open,
  onOpenChange,
  userEmail,
  tenantName,
  currentPath,
  supportEmail = config.support.email,
  helpDocsUrl = config.support.helpDocsUrl,
  environment = config.observability.environment,
  release = config.observability.release,
  productName = config.app.name || BRAND.productName,
}: HelpDialogProps) {
  const displayTenant = tenantName?.trim() || copy.contextMissing;
  const displayUser = userEmail?.trim() || copy.contextMissing;
  const displayPath = currentPath.trim() || "/";
  const displayEnv = environment.trim() || copy.contextMissing;
  const displayRelease = release.trim() || copy.contextMissing;
  const docsUrl = helpDocsUrl.trim();
  const mailtoHref = buildSupportMailto({
    supportEmail,
    productName,
    tenantName,
    userEmail,
    currentPath: displayPath,
    environment: displayEnv,
    release: displayRelease,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">{copy.contextTenant}</dt>
          <dd className="min-w-0 truncate font-medium text-foreground">
            {displayTenant}
          </dd>
          <dt className="text-muted-foreground">{copy.contextUser}</dt>
          <dd className="min-w-0 truncate font-medium text-foreground">
            {displayUser}
          </dd>
          <dt className="text-muted-foreground">{copy.contextPage}</dt>
          <dd className="min-w-0 truncate font-medium text-foreground">
            {displayPath}
          </dd>
          <dt className="text-muted-foreground">{copy.contextEnv}</dt>
          <dd className="min-w-0 truncate font-medium text-foreground">
            {displayEnv}
          </dd>
          <dt className="text-muted-foreground">{copy.contextVersion}</dt>
          <dd className="min-w-0 truncate font-medium text-foreground">
            {displayRelease}
          </dd>
        </dl>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button asChild className="w-full sm:w-full">
            <a href={mailtoHref}>{copy.contactSupport}</a>
          </Button>
          {docsUrl ? (
            <Button asChild variant="outline" className="w-full sm:w-full">
              <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                {copy.docs}
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-full"
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
