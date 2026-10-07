import { apiClient } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import type {
  ApprovalConcept,
  ApprovalPoliciesOverview,
  ApprovalRules,
  PolicyCandidates,
  PolicyVersionPage,
  SavedPolicyVersion,
  SimulationFacts,
  SimulationResult,
} from "../domain/entities";
import {
  collectEligibleUserIds,
  mapApprovalPoliciesOverview,
  mapPolicyCandidates,
  mapPolicyVersionsResponse,
  mapSavedPolicyVersion,
  mapSimulationResult,
  toApiRules,
  toApiSimulationFacts,
  type ApiApprovalPoliciesOverview,
  type ApiPolicyCandidates,
  type ApiPolicyVersionsResponse,
  type ApiSavedPolicyVersion,
  type ApiSimulationResult,
} from "./mappers";

const ENDPOINT = "/approval-policies";

export interface SavePolicyInput {
  readonly concept: ApprovalConcept;
  /** `null` = primera versión del tenant para el concepto. */
  readonly expectedVersion: number | null;
  readonly rules: ApprovalRules;
}

export interface SavedPolicyResponse {
  readonly message: string;
  readonly data: SavedPolicyVersion;
}

export const approvalPoliciesApi = {
  getOverview: async (): Promise<ApprovalPoliciesOverview> => {
    const response = await apiClient.get<ApiSingleResponse<ApiApprovalPoliciesOverview>>(ENDPOINT);
    return mapApprovalPoliciesOverview(response.data);
  },

  save: async ({ concept, expectedVersion, rules }: SavePolicyInput): Promise<SavedPolicyResponse> => {
    const response = await apiClient.put<{ message: string; data: ApiSavedPolicyVersion }>(
      `${ENDPOINT}/${concept}`,
      {
        expected_version: expectedVersion,
        rules: toApiRules(rules),
        eligible_user_ids: collectEligibleUserIds(rules),
      },
    );
    return { message: response.message, data: mapSavedPolicyVersion(response.data) };
  },

  reset: async (concept: ApprovalConcept, expectedVersion: number | null): Promise<SavedPolicyResponse> => {
    const response = await apiClient.post<{ message: string; data: ApiSavedPolicyVersion }>(
      `${ENDPOINT}/${concept}/reset`,
      { expected_version: expectedVersion },
    );
    return { message: response.message, data: mapSavedPolicyVersion(response.data) };
  },

  listVersions: async (concept: ApprovalConcept, page = 1, limit = 20): Promise<PolicyVersionPage> => {
    const response = await apiClient.get<ApiPolicyVersionsResponse>(`${ENDPOINT}/${concept}/versions`, {
      params: { page: String(page), limit: String(limit) },
    });
    return mapPolicyVersionsResponse(response);
  },

  /** `rules: null` simula contra la regla vigente. */
  simulate: async (
    concept: ApprovalConcept,
    rules: ApprovalRules | null,
    facts: SimulationFacts,
  ): Promise<SimulationResult> => {
    const response = await apiClient.post<ApiSingleResponse<ApiSimulationResult>>(
      `${ENDPOINT}/${concept}/simulate`,
      { rules: rules ? toApiRules(rules) : null, facts: toApiSimulationFacts(facts) },
    );
    return mapSimulationResult(response.data);
  },

  /**
   * Autorizadores posibles (activos dentro del techo) para elegir «personas
   * designadas» y contar elegibles, más los nombrados en reglas vigentes que
   * ya no pueden firmar. Solo admin (`approval_policies.update`).
   */
  listCandidateUsers: async (): Promise<PolicyCandidates> => {
    const response = await apiClient.get<ApiSingleResponse<ApiPolicyCandidates>>(`${ENDPOINT}/candidates`);
    return mapPolicyCandidates(response.data);
  },
};
