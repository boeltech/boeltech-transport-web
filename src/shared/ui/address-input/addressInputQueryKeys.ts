/**
 * Query keys de catálogos SAT / CP usados por address-input.
 * Misma forma que los literales históricos en use-sat-catalogs / use-postal-code-lookup.
 */
export const addressInputQueryKeys = {
  satStates: () => ["address-sat-states"] as const,
  satMunicipalities: (stateCode: string) =>
    ["address-sat-municipalities", stateCode] as const,
  satNeighborhoods: (postalCode: string) =>
    ["address-sat-neighborhoods", postalCode] as const,
  postalLookup: (postalCode: string) =>
    ["address-postal-lookup", postalCode] as const,
} as const;
