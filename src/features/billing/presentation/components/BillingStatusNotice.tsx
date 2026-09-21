import { Link } from "react-router-dom";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { billingCopy } from "../copy/billingCopy";
import { getStampRunOutSentence } from "../utils/billingFormatters";
import {
  resolveCapacityOverQuotaScope,
  type BillingNoticeId,
} from "../utils/billingNotice";

interface BillingStatusNoticeProps {
  notice: BillingNoticeId | null;
  includedStamps: number;
  stampsRemaining: number;
  trialEndsAtLabel: string;
  graceDeadlineLabel: string;
  quotaPolicy: string;
  /** ADR-0095 — flags del snapshot capacity (o meta branches como fallback). */
  usersOverQuota?: boolean;
  branchesOverQuota?: boolean;
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
 * Avisos críticos (bloqueo, prueba, timbres, past_due sin saldo open, OVER_LIMIT).
 * Saldo open → `BillingArrearsCard` (D3/D8).
 */
export function BillingStatusNotice({
  notice,
  includedStamps,
  stampsRemaining,
  trialEndsAtLabel,
  graceDeadlineLabel,
  quotaPolicy,
  usersOverQuota = false,
  branchesOverQuota = false,
}: BillingStatusNoticeProps) {
  if (!notice) return null;

  const copy = billingCopy.notices;

  if (notice === "capacity_over_quota" || notice === "branches_over_quota") {
    const scope =
      resolveCapacityOverQuotaScope({ usersOverQuota, branchesOverQuota }) ??
      "branches";
    const over = copy.capacityOverQuota;
    return (
      <AlertWithIcon variant="warning" title={over.title[scope]}>
        <p>{over.description[scope]}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scope === "users" || scope === "both" ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/users">{over.goUsers}</Link>
            </Button>
          ) : null}
          {scope === "branches" || scope === "both" ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/branches">{over.goBranches}</Link>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="secondary" asChild>
            <a href={`mailto:${billingCopy.contact.email}`}>{copy.contactCta}</a>
          </Button>
        </div>
      </AlertWithIcon>
    );
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
