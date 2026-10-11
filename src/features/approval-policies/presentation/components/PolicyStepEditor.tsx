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
import { Skeleton } from "@shared/ui/skeleton";
import { FieldInlineError } from "@shared/ui/form";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import {
  ceilingUsers,
  eligibleUsersForStep,
  getConceptCeilingRoles,
  resolveDesignatedPerson,
  type ApprovalConcept,
  type PolicyCandidateUser,
  type PolicyReferencedUser,
} from "../../domain";
import { approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import type { PolicyFormStep, PolicyFormValues } from "../validation/approvalPolicySchema";

const copy = approvalPoliciesCopy.sheet;

/** Padrón de personas para los pasos del editor (`GET /approval-policies/candidates`). */
export interface PolicyPeopleState {
  readonly status: "loading" | "error" | "ready";
  /** Activos del techo; `null` mientras no se conocen. Única fuente de elegibles. */
  readonly users: PolicyCandidateUser[] | null;
  /** Nombrados en reglas vigentes que ya no pueden firmar; solo para mostrar su nombre. */
  readonly referencedUsers: readonly PolicyReferencedUser[];
}

interface PolicyStepEditorProps {
  form: UseFormReturn<PolicyFormValues>;
  concept: ApprovalConcept;
  tierIndex: number;
  stepIndex: number;
  stepsInTier: number;
  people: PolicyPeopleState;
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
  people,
}: PolicyStepEditorProps) {
  const path = `tiers.${tierIndex}.steps.${stepIndex}` as const;
  const step = useWatch({ control: form.control, name: path }) as PolicyFormStep | undefined;
  const error = get(form.formState.errors, path) as { message?: string } | undefined;
  const [peopleOpen, setPeopleOpen] = useState(false);
  const ceiling = getConceptCeilingRoles(concept);
  const fieldId = policyStepFieldId(tierIndex, stepIndex);
  const roles = step?.eligibleRoles ?? [];
  const userIds = step?.eligibleUserIds ?? [];
  const users = people.status === "ready" ? people.users : null;
  const selectable = users ? ceilingUsers(concept, users) : [];
  const eligibleCount = users && step ? eligibleUsersForStep(step, concept, users).length : null;
  /** En error de padrón aún resolvemos chips con referenciados conocidos (o «no disponible»). */
  const designatedLookup = {
    users: users ?? [],
    referencedUsers: people.referencedUsers,
  };
  const showDesignatedChips = userIds.length > 0 && people.status !== "loading";

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

      {people.status === "loading" ? (
        <div className="space-y-1.5" aria-busy="true" aria-label={copy.peopleLoading}>
          <p className="text-xs font-medium">{copy.peopleLabel}</p>
          <Skeleton className="h-8 w-full" data-testid={`${fieldId}-people-loading`} />
        </div>
      ) : users || showDesignatedChips ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium">{copy.peopleLabel}</p>
          {users ? (
            selectable.length === 0 ? (
              <p className="text-xs text-muted-foreground" data-testid={`${fieldId}-people-empty`}>
                {copy.peopleNoneActive}
              </p>
            ) : (
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
                      {userIds.length > 0
                        ? copy.peopleSelected(userIds.length)
                        : copy.peoplePlaceholder}
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
            )
          ) : null}
          {showDesignatedChips ? (
            <div className="flex flex-wrap gap-1.5">
              {userIds.map((id) => {
                const person = resolveDesignatedPerson(id, concept, designatedLookup);
                const name = person.fullName ?? copy.personUnavailable;
                const stateLabel =
                  person.state === "eligible" ? "" : copy.personState[person.state];
                return (
                  <Badge
                    key={id}
                    variant={person.state === "eligible" ? "neutral" : "outline"}
                    tone="soft"
                    className={cn(
                      "gap-1 text-xs",
                      person.state !== "eligible" &&
                        "border-dashed font-normal text-muted-foreground",
                    )}
                    data-testid={`${fieldId}-person-${id}`}
                    data-state={person.state}
                  >
                    {name}
                    {stateLabel ? <span>· {stateLabel}</span> : null}
                    <button
                      type="button"
                      onClick={() => toggleUser(id)}
                      aria-label={copy.removePerson(name)}
                      className="rounded-sm hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
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
