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
  quotaPolicy: string;
  branchesMeta?: BranchListMeta;
}

export function BillingStatusNotice({
  notice,
  includedStamps,
  stampsRemaining,
  trialEndsAtLabel,
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
        <p className="mt-2">
          <a
            className="font-medium underline underline-offset-4"
            href={`mailto:${billingCopy.contact.email}`}
          >
            {copy.contactCta}
          </a>
        </p>
      </AlertWithIcon>
    );
  }

  if (notice === "trial_exhausted") {
    return (
      <AlertWithIcon variant="destructive" title={copy.trialExhausted.title}>
        {copy.trialExhausted.description(includedStamps)}
      </AlertWithIcon>
    );
  }

  if (notice === "trial_ended") {
    return (
      <AlertWithIcon variant="info" title={copy.trialEnded.title}>
        {copy.trialEnded.description(trialEndsAtLabel)}
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
