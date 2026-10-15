import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";

const hasSession = vi.fn(() => false);
const getToken = vi.fn(() => null as string | null);

vi.mock("@features/auth", () => ({
  tokenStorage: {
    hasSession: () => hasSession(),
    getToken: () => getToken(),
  },
}));

import RootRedirect from "./RootRedirect";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderRoot() {
  return renderWithTheme(
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
        <Route path="/welcome" element={<div>welcome</div>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: ["/"], resolvedTheme: "light" },
  );
}

describe("RootRedirect (Ola 9 — P9-07)", () => {
  beforeEach(() => {
    hasSession.mockReset();
    getToken.mockReset();
    hasSession.mockReturnValue(false);
    getToken.mockReturnValue(null);
  });

  it("cookies session marker → /dashboard without access token", () => {
    hasSession.mockReturnValue(true);
    getToken.mockReturnValue(null);
    renderRoot();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("no session → /welcome", () => {
    hasSession.mockReturnValue(false);
    renderRoot();
    expect(screen.getByText("welcome")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/welcome");
  });

  it("does not rely on getToken alone (token without hasSession stays welcome)", () => {
    hasSession.mockReturnValue(false);
    getToken.mockReturnValue("stale-bearer");
    renderRoot();
    expect(screen.getByText("welcome")).toBeInTheDocument();
  });
});
