import type {
  DispatchRecipient,
  RecipientsByClient,
  RecipientOverrideEntry,
} from "../../domain/billingDispatchRun.types";

/** Selección local: clientId → set de recipient keys marcadas. */
export type RecipientSelectionState = Record<string, string[]>;

export function filterRecipientGroupsByClientIds(
  groups: RecipientsByClient[] | undefined,
  clientIds: Iterable<string>,
): RecipientsByClient[] {
  const set = new Set(clientIds);
  return (groups ?? []).filter((group) => set.has(group.clientId));
}

export function defaultRecipientSelection(
  groups: RecipientsByClient[] | undefined,
): RecipientSelectionState {
  const next: RecipientSelectionState = {};
  for (const group of groups ?? []) {
    next[group.clientId] = group.recipients.map((r) => r.key);
  }
  return next;
}

export function countSelectedRecipients(
  selection: RecipientSelectionState,
): number {
  let total = 0;
  for (const keys of Object.values(selection)) {
    total += keys.length;
  }
  return total;
}

/** Clientes listos (con grupo de destinatarios) que quedaron en 0 keys. */
export function clientsWithZeroSelected(
  groups: RecipientsByClient[] | undefined,
  selection: RecipientSelectionState,
): string[] {
  const empty: string[] = [];
  for (const group of groups ?? []) {
    const keys = selection[group.clientId] ?? [];
    if (keys.length === 0) {
      empty.push(group.clientId);
    }
  }
  return empty;
}

function sameKeySet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((key) => setB.has(key));
}

/**
 * Solo incluye clientes cuyo subset ≠ todos los elegibles (compat confirm-send).
 */
export function buildRecipientOverrides(
  groups: RecipientsByClient[] | undefined,
  selection: RecipientSelectionState,
): RecipientOverrideEntry[] | undefined {
  const overrides: RecipientOverrideEntry[] = [];
  for (const group of groups ?? []) {
    const eligibleKeys = group.recipients.map((r) => r.key);
    const selected = selection[group.clientId] ?? [];
    if (!sameKeySet(selected, eligibleKeys)) {
      overrides.push({
        clientId: group.clientId,
        recipientKeys: selected,
      });
    }
  }
  return overrides.length > 0 ? overrides : undefined;
}

export function toggleRecipientKey(
  selection: RecipientSelectionState,
  clientId: string,
  key: string,
  checked: boolean,
): RecipientSelectionState {
  const current = selection[clientId] ?? [];
  const nextKeys = checked
    ? current.includes(key)
      ? current
      : [...current, key]
    : current.filter((k) => k !== key);
  return { ...selection, [clientId]: nextKeys };
}

export function recipientsForClient(
  groups: RecipientsByClient[] | undefined,
  clientId: string,
): DispatchRecipient[] {
  return groups?.find((g) => g.clientId === clientId)?.recipients ?? [];
}
