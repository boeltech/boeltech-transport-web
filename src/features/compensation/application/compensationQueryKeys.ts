export const compensationQueryKeys = {
  all: ["compensation"] as const,
  templates: () => [...compensationQueryKeys.all, "templates"] as const,
  templatesList: (params?: Record<string, unknown>) =>
    [...compensationQueryKeys.templates(), "list", params] as const,
  templateDetail: (id: string) =>
    [...compensationQueryKeys.templates(), "detail", id] as const,
  corridors: () => [...compensationQueryKeys.all, "corridors"] as const,
  corridorsList: (params?: Record<string, unknown>) =>
    [...compensationQueryKeys.corridors(), "list", params] as const,
  corridorsDuplicateCatalog: () =>
    [...compensationQueryKeys.corridors(), "duplicate-catalog"] as const,
  corridorDetail: (id: string) =>
    [...compensationQueryKeys.corridors(), "detail", id] as const,
  assignments: () => [...compensationQueryKeys.all, "assignments"] as const,
  assignmentsList: (params?: Record<string, unknown>) =>
    [...compensationQueryKeys.assignments(), "list", params] as const,
  allowanceOverrides: () => [...compensationQueryKeys.all, "allowance-overrides"] as const,
  allowanceOverridesList: (params?: Record<string, unknown>) =>
    [...compensationQueryKeys.allowanceOverrides(), "list", params] as const,
};
