import { useState } from "react";
import { get, useWatch, type UseFormReturn } from "react-hook-form";
import { Check, ChevronsUpDown, Users, X } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { FieldInlineError } from "@shared/ui/form";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import {
  ceilingUsers,
  eligibleUsersForStep,
  getConceptCeilingRoles,
  type ApprovalConcept,
  type PolicyCandidateUser,
} from "../../domain";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import type { PolicyFormStep, PolicyFormValues } from "../validation/approvalPolicySchema";

const copy = approvalPoliciesCopy.sheet;

interface PolicyStepEditorProps {
  form: UseFormReturn<PolicyFormValues>;
  concept: ApprovalConcept;
  tierIndex: number;
  stepIndex: number;
  stepsInTier: number;
  /** `null` = no se conocen los usuarios (sin contador ni personas). */
  candidateUsers: PolicyCandidateUser[] | null;
}

function policyStepFieldId(tierIndex: number, stepIndex: number): string {
  return `policy-tier-${tierIndex}-step-${stepIndex}`;
}

export function PolicyStepEditor({
  form,
  concept,
  tierIndex,
  stepIndex,
  stepsInTier,
  candidateUsers,
}: PolicyStepEditorProps) {
  const path = `tiers.${tierIndex}.steps.${stepIndex}` as const;
  const step = useWatch({ control: form.control, name: path }) as PolicyFormStep | undefined;
  const error = get(form.formState.errors, path) as { message?: string } | undefined;
  const [peopleOpen, setPeopleOpen] = useState(false);
  const ceiling = getConceptCeilingRoles(concept);
  const fieldId = policyStepFieldId(tierIndex, stepIndex);
  const roles = step?.eligibleRoles ?? [];
  const userIds = step?.eligibleUserIds ?? [];
  const selectable = candidateUsers ? ceilingUsers(concept, candidateUsers) : [];
  const eligibleCount =
    candidateUsers && step ? eligibleUsersForStep(step, concept, candidateUsers).length : null;

  const update = (next: PolicyFormStep) => {
    form.setValue(path, next, { shouldDirty: true });
    form.clearErrors(path);
  };

  const toggleRole = (role: UserRole, checked: boolean) => {
    const nextRoles = checked ? [...roles, role] : roles.filter((r) => r !== role);
    update({ eligibleRoles: ceiling.filter((r) => nextRoles.includes(r)), eligibleUserIds: userIds });
  };

  const toggleUser = (id: string) => {
    const next = userIds.includes(id) ? userIds.filter((u) => u !== id) : [...userIds, id];
    update({ eligibleRoles: roles, eligibleUserIds: next });
  };

  const nameOf = (id: string) => candidateUsers?.find((u) => u.id === id)?.fullName ?? id.slice(0, 8);

  return (
    <fieldset
      className={cn(
        "space-y-3 rounded-md border bg-background p-3",
        error?.message && "border-destructive",
      )}
      aria-invalid={Boolean(error?.message)}
      aria-describedby={error?.message ? `${fieldId}-error` : undefined}
      data-testid={fieldId}
    >
      <legend className="px-1 text-xs font-medium text-muted-foreground">
        {stepsInTier > 1 ? copy.stepTitle(stepIndex + 1) : copy.singleStepTitle}
      </legend>

      <div className="space-y-1.5">
        <p className="text-xs font-medium">{copy.rolesLabel}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ceiling.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={roles.includes(role)}
                onCheckedChange={(checked) => toggleRole(role, checked === true)}
                aria-label={`${ROLE_LABELS[role]} · ${copy.stepTitle(stepIndex + 1)}`}
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      </div>

      {candidateUsers ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">{copy.peopleLabel}</p>
          <Popover open={peopleOpen} onOpenChange={setPeopleOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-between font-normal"
                aria-label={`${copy.peopleLabel} · ${copy.stepTitle(stepIndex + 1)}`}
              >
                <span className="truncate text-muted-foreground">
                  {userIds.length > 0 ? `${userIds.length} seleccionada(s)` : copy.peoplePlaceholder}
                </span>
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder={copy.peopleSearch} />
                <CommandList>
                  <CommandEmpty>{copy.peopleEmpty}</CommandEmpty>
                  <CommandGroup>
                    {selectable.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.fullName} ${user.id}`}
                        onSelect={() => toggleUser(user.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            userIds.includes(user.id) ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{user.fullName}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {userIds.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {userIds.map((id) => (
                <Badge key={id} variant="neutral" tone="soft" className="gap-1 text-xs">
                  {nameOf(id)}
                  <button
                    type="button"
                    onClick={() => toggleUser(id)}
                    aria-label={`Quitar ${nameOf(id)}`}
                    className="rounded-sm hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {eligibleCount !== null ? (
        <p
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            eligibleCount === 0 ? "text-destructive" : "text-muted-foreground",
          )}
          data-testid={`${fieldId}-eligible`}
        >
          <Users className="h-3.5 w-3.5" />
          {copy.eligibleCount(eligibleCount)}
        </p>
      ) : null}
      {eligibleCount === 1 ? (
        <p className="text-xs text-muted-foreground">{copy.singleEligibleWarning}</p>
      ) : null}

      <FieldInlineError fieldId={fieldId} message={error?.message} />
    </fieldset>
  );
}
