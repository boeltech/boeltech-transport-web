export interface BranchSelectListItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}

export interface BranchSelectOption {
  value: string;
  label: string;
  outsidePlan?: boolean;
}

export function buildBranchSelectOptions(
  branches: readonly BranchSelectListItem[],
): BranchSelectOption[] {
  return [...branches]
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((branch) => ({
      value: branch.id,
      label: `${branch.code} — ${branch.name}`,
    }));
}

export function buildBranchSelectOptionsWithEligibility(
  branches: readonly BranchSelectListItem[],
  eligibleBranchIds: readonly string[],
  currentBranchId?: string,
): BranchSelectOption[] {
  const eligible = new Set(eligibleBranchIds);
  const hasEligibilityFilter = eligibleBranchIds.length > 0;

  return [...branches]
    .filter((branch) => {
      if (!hasEligibilityFilter) return true;
      if (eligible.has(branch.id)) return true;
      return currentBranchId === branch.id;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((branch) => ({
      value: branch.id,
      label:
        hasEligibilityFilter &&
        !eligible.has(branch.id) &&
        currentBranchId === branch.id
          ? `${branch.code} — ${branch.name} (fuera de plan)`
          : `${branch.code} — ${branch.name}`,
      outsidePlan:
        hasEligibilityFilter &&
        !eligible.has(branch.id) &&
        currentBranchId === branch.id,
    }));
}

export function formatBranchLabel(
  branchName: string | null | undefined,
  branchCode: string | null | undefined,
  legacyFallback?: string | null | undefined,
): string | null {
  if (branchName) {
    return branchCode ? `${branchCode} — ${branchName}` : branchName;
  }
  const legacy = legacyFallback?.trim();
  return legacy ? legacy : null;
}

/** @deprecated Use formatBranchLabel — kept for employee work_location fallback */
export function formatEmployeeBranchLabel(
  branchName: string | null | undefined,
  branchCode: string | null | undefined,
  legacyWorkLocation: string | null | undefined,
): string | null {
  return formatBranchLabel(branchName, branchCode, legacyWorkLocation);
}
