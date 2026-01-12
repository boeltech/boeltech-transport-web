import { apiClient } from "@shared/api";
import type {
  AuthResponse,
  LoginCredentials,
  User,
} from "@features/auth/model/types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    // return response.data;
    return response;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    // return response.data;
    return response;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>("/auth/refresh");
    // return response.data;
    return response;
  },
};
