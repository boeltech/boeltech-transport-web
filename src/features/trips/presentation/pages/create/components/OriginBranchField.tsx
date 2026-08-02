/**
 * Selector de base operativa del viaje (paso 1).
 * Alimenta el filtro suave de flota en TripAssignmentResourceFields (ADR-0065).
 */
import { Link } from "react-router-dom";
import type { UseFormReturn } from "react-hook-form";
import { Building2 } from "lucide-react";

import { Button } from "@shared/ui/button";
import { RHFSelect } from "@shared/ui/form/RHFSelect";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { BranchStatus, useBranches } from "@features/branches";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
import { useMemo } from "react";

import { wizardCopy } from "../../../copy";
import type { TripWizardFormValues } from "./validation";

const copy = wizardCopy.basicInfo;

export interface OriginBranchFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
}

export function OriginBranchField({ form }: OriginBranchFieldProps) {
  const { data: branchesResult } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const branchOptions = useMemo(
    () => buildBranchSelectOptions(branchesResult?.data ?? []),
    [branchesResult?.data],
  );
  const hasBranchOptions = branchOptions.length > 0;

  return (
    <div className="max-w-md space-y-3">
      <SectionHeadingWithHint
        title={copy.label.originBranch}
        hintLabel={copy.hintLabel.originBranch}
        hint={<>{copy.hint.originBranch}</>}
      />
      {hasBranchOptions ? (
        <RHFSelect
          control={form.control}
          name="originBranchId"
          options={branchOptions}
          placeholder={copy.placeholder.selectOriginBranch}
        />
      ) : (
        <>
          <Select disabled>
            <SelectTrigger disabled>
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={copy.placeholder.selectOriginBranch} />
            </SelectTrigger>
            <SelectContent />
          </Select>
          <p className="text-xs text-muted-foreground">{copy.state.noBranches}</p>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link to="/branches/new">{copy.action.createBranch}</Link>
          </Button>
        </>
      )}
    </div>
  );
}
