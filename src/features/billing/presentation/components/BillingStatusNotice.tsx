import { AlertWithIcon } from "@shared/ui/alert";
import { BranchOverQuotaBanner } from "@features/branches/presentation/components/BranchOverQuotaBanner";
import type { BranchListMeta } from "@features/branches/domain";
import { billingCopy } from "../copy/billingCopy";
import { getStampRunOutSentence } from "../utils/billingFormatters";
import type { BillingNoticeId } from "../utils/billingNotice";

interface BillingStatusNoticeProps {
  notice: BillingNoticeId | null;
  includedStamps: number;
  stampsRemaining: number;
  trialEndsAtLabel: string;
  graceDeadlineLabel: string;
  quotaPolicy: string;
  branchesMeta?: BranchListMeta;
}

function ContactMailtoLink({ label }: { label: string }) {
  return (
    <p className="mt-2">
      <a
        className="font-medium underline underline-offset-4"
        href={`mailto:${billingCopy.contact.email}`}
      >
        {label}
      </a>
    </p>
  );
}

/**
 * Avisos críticos (bloqueo, prueba, timbres, past_due sin saldo open).
 * Saldo open → `BillingArrearsCard` (D3/D8).
 */
export function BillingStatusNotice({
  notice,
  includedStamps,
  stampsRemaining,
  trialEndsAtLabel,
  graceDeadlineLabel,
  quotaPolicy,
  branchesMeta,
}: BillingStatusNoticeProps) {
  if (!notice) return null;

  const copy = billingCopy.notices;

  if (notice === "branches_over_quota") {
    return <BranchOverQuotaBanner meta={branchesMeta} hideBillingLink />;
  }

  if (notice === "no_plan" || notice === "blocked") {
    const content = notice === "blocked" ? copy.blocked : copy.noPlan;
    return (
      <AlertWithIcon variant="destructive" title={content.title}>
        <p>{content.description}</p>
        <ContactMailtoLink label={copy.contactCta} />
      </AlertWithIcon>
    );
  }

  // D3: `arrears` ya no se emite desde resolveBillingNotice; guard residual.
  if (notice === "arrears") {
    return null;
  }

  if (notice === "past_due") {
    return (
      <AlertWithIcon variant="warning" title={copy.pastDue.title}>
        <p>{copy.pastDue.description(graceDeadlineLabel)}</p>
        <p className="mt-2 text-sm">{copy.pastDue.softCapNote}</p>
        <ContactMailtoLink label={copy.contactCta} />
      </AlertWithIcon>
    );
  }

  if (notice === "trial_exhausted") {
    return (
      <AlertWithIcon variant="destructive" title={copy.trialExhausted.title}>
        <p>{copy.trialExhausted.description(includedStamps)}</p>
        <ContactMailtoLink label={copy.contactCta} />
      </AlertWithIcon>
    );
  }

  if (notice === "trial_ended") {
    return (
      <AlertWithIcon variant="warning" title={copy.trialEnded.title}>
        <p>{copy.trialEnded.description(trialEndsAtLabel)}</p>
        <ContactMailtoLink label={copy.contactCta} />
      </AlertWithIcon>
    );
  }

  if (notice === "stamps_exhausted") {
    return (
      <AlertWithIcon variant="destructive" title={copy.stampsExhausted.title}>
        {copy.stampsExhausted.description(getStampRunOutSentence(quotaPolicy))}
      </AlertWithIcon>
    );
  }

  return (
    <AlertWithIcon variant="warning" title={copy.stampsLow.title}>
      {copy.stampsLow.description(stampsRemaining)}
    </AlertWithIcon>
  );
}
