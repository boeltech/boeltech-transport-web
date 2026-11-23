export type HelpScreenExtras = Record<string, string>;

type Listener = () => void;

const owners = new Map<string, HelpScreenExtras>();
const listeners = new Set<Listener>();

function flattenOwners(): HelpScreenExtras {
  const merged: HelpScreenExtras = {};
  for (const entry of owners.values()) {
    Object.assign(merged, entry);
  }
  return merged;
}

let snapshot: HelpScreenExtras = {};

function emit(): void {
  snapshot = flattenOwners();
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Publish opaque extras for `ownerId`. Pass `null` (or `{}`) to clear.
 */
export function publishHelpScreenExtras(
  ownerId: string,
  extras: HelpScreenExtras | null,
): void {
  if (extras == null || Object.keys(extras).length === 0) {
    if (!owners.has(ownerId)) return;
    owners.delete(ownerId);
  } else {
    owners.set(ownerId, { ...extras });
  }
  emit();
}

export function getHelpScreenExtrasSnapshot(): HelpScreenExtras {
  return snapshot;
}

export function subscribeHelpScreenExtras(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only: wipe all owners between cases. */
export function resetHelpScreenExtrasStoreForTests(): void {
  owners.clear();
  snapshot = {};
  for (const listener of listeners) {
    listener();
  }
}
