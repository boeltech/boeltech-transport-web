import { AlertWithIcon } from "@shared/ui/alert";
import type { BulkOutcomeCounts } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.bulkFlow;

export interface BulkDecisionFailureRow {
  key: string;
  folio: string;
  message: string;
}

/**
 * Handoff F6 D10: resultado de una masiva con fallas, dentro del diálogo
 * (`overlays-toast.mdc`): conteo por resultado + qué no se procesó y por qué.
 */
export function BulkDecisionResultPanel({
  total,
  counts,
  nextStep,
  nextRole = null,
  failures,
}: {
  total: number;
  counts: BulkOutcomeCounts;
  nextStep: number | null;
  nextRole?: string | null;
  failures: ReadonlyArray<BulkDecisionFailureRow>;
}) {
  const summary = copy.successSummary({
    approved: counts.approved,
    stepSigned: counts.step_signed,
    returned: counts.returned,
    rejected: counts.rejected,
    nextStep,
    nextRole,
  });

  return (
    <div className="space-y-3">
      {summary ? <p className="text-sm">{summary}</p> : null}
      <AlertWithIcon variant="warning" title={copy.failuresTitle(failures.length, total)}>
        <ul className="mt-1 space-y-1 text-sm">
          {failures.map((failure) => (
            <li key={failure.key}>
              <span className="font-medium">{failure.folio}</span>
              {": "}
              {failure.message}
            </li>
          ))}
        </ul>
      </AlertWithIcon>
    </div>
  );
}
