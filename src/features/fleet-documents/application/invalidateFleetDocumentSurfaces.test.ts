import { describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";

import { dashboardQueryKeys } from "@features/dashboard/domain";
import { fleetDocumentsQueryKeys } from "@features/fleet-documents/domain";

import { invalidateFleetDocumentSurfaces } from "./invalidateFleetDocumentSurfaces";

describe("invalidateFleetDocumentSurfaces", () => {
  it("invalidates fleetDocuments and dashboard live queries", () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateFleetDocumentSurfaces(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: fleetDocumentsQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all,
    });
  });
});
