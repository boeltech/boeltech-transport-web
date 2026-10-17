/**
 * Demo seed API — GET/POST /setup/demo-seed + purge (F2).
 */

import { apiClient } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import type {
  DemoSeedApplyResult,
  DemoSeedPurgeResult,
  DemoSeedStatus,
} from "../domain/types";
import { DEMO_OPS_PACK, DEMO_PURGE_CONFIRM } from "../domain/types";
import {
  mapDemoSeedApplyResult,
  mapDemoSeedPurgeResult,
  mapDemoSeedStatus,
} from "./demoSeedMappers";

export const demoSeedApi = {
  getStatus: async (): Promise<DemoSeedStatus> => {
    const response = await apiClient.get<
      ApiSingleResponse<Record<string, unknown>>
    >("/setup/demo-seed");
    return mapDemoSeedStatus(response.data as Record<string, unknown>);
  },

  apply: async (options?: {
    includeDraftTrip?: boolean;
  }): Promise<DemoSeedApplyResult> => {
    const response = await apiClient.post<
      ApiSingleResponse<Record<string, unknown>> & { message?: string }
    >("/setup/demo-seed", {
      pack: DEMO_OPS_PACK,
      includeDraftTrip: options?.includeDraftTrip ?? true,
    });
    return mapDemoSeedApplyResult(response.data as Record<string, unknown>);
  },

  purge: async (): Promise<DemoSeedPurgeResult> => {
    const response = await apiClient.post<
      ApiSingleResponse<Record<string, unknown>> & { message?: string }
    >("/setup/demo-seed:purge", {
      confirm: DEMO_PURGE_CONFIRM,
    });
    return mapDemoSeedPurgeResult(response.data as Record<string, unknown>);
  },
};
