import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PlatformMfaEnrollmentGate } from "./PlatformMfaEnrollmentGate";

vi.mock("./PlatformAuthProvider", () => ({
  usePlatformAuth: vi.fn(),
}));

import { usePlatformAuth } from "./PlatformAuthProvider";

const usePlatformAuthMock = vi.mocked(usePlatformAuth);

describe("PlatformMfaEnrollmentGate", () => {
  it("shows loading fallback and does not render children while isLoading", () => {
    usePlatformAuthMock.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: true,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/platform"]}>
        <PlatformMfaEnrollmentGate>
          <div data-testid="console-child">console</div>
        </PlatformMfaEnrollmentGate>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("platform-auth-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("console-child")).not.toBeInTheDocument();
  });

  it("redirects owner without MFA to /platform/security", () => {
    usePlatformAuthMock.mockReturnValue({
      user: {
        id: "u1",
        email: "owner@test.com",
        firstName: "O",
        lastName: "W",
        platformRole: "platform_owner",
        scope: "platform",
        mfaEnabled: false,
      },
      token: "at",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/platform"]}>
        <Routes>
          <Route
            path="/platform"
            element={
              <PlatformMfaEnrollmentGate>
                <div data-testid="console-child">console</div>
              </PlatformMfaEnrollmentGate>
            }
          />
          <Route
            path="/platform/security"
            element={<div data-testid="security-page">security</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("console-child")).not.toBeInTheDocument();
    expect(screen.getByTestId("security-page")).toBeInTheDocument();
  });

  it("renders children when owner has MFA enabled", () => {
    usePlatformAuthMock.mockReturnValue({
      user: {
        id: "u1",
        email: "owner@test.com",
        firstName: "O",
        lastName: "W",
        platformRole: "platform_owner",
        scope: "platform",
        mfaEnabled: true,
      },
      token: "at",
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/platform"]}>
        <PlatformMfaEnrollmentGate>
          <div data-testid="console-child">console</div>
        </PlatformMfaEnrollmentGate>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("console-child")).toBeInTheDocument();
  });
});
