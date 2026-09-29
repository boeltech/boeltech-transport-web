import { describe, expect, it } from "vitest";
import {
  isUsefulOnboardingFromPath,
  readOnboardingFromState,
  resolveOnboardingFamily,
  resolveOnboardingLanding,
} from "./onboardingFamily";

describe("resolveOnboardingFamily", () => {
  it("maps admin + billing.read to founder even without register funnel", () => {
    expect(
      resolveOnboardingFamily({
        role: "admin",
        hasFunnelPreference: false,
        canReadBilling: true,
      }),
    ).toBe("founder");
  });

  it("maps admin + funnel + billing.read to founder", () => {
    expect(
      resolveOnboardingFamily({
        role: "admin",
        hasFunnelPreference: true,
        canReadBilling: true,
      }),
    ).toBe("founder");
  });

  it("treats founder without billing.read as staff (D5)", () => {
    expect(
      resolveOnboardingFamily({
        role: "admin",
        hasFunnelPreference: true,
        canReadBilling: false,
      }),
    ).toBe("staff");
  });

  it.each(["manager", "dispatcher", "accountant", "operator"] as const)(
    "maps %s to staff even with funnel",
    (role) => {
      expect(
        resolveOnboardingFamily({
          role,
          hasFunnelPreference: true,
          canReadBilling: true,
        }),
      ).toBe("staff");
    },
  );

  it.each(["driver", "client"] as const)(
    "maps %s to portal even with funnel and billing.read",
    (role) => {
      expect(
        resolveOnboardingFamily({
          role,
          hasFunnelPreference: true,
          canReadBilling: true,
        }),
      ).toBe("portal");
    },
  );
});

describe("resolveOnboardingLanding", () => {
  it.each([
    ["admin", "/settings/billing"],
    ["manager", "/trips"],
    ["dispatcher", "/trips"],
    ["operator", "/trips"],
    ["accountant", "/finance/invoiceable"],
    ["driver", "/trips"],
    ["client", "/trips"],
  ] as const)("maps %s to %s when from is empty", (role, path) => {
    expect(resolveOnboardingLanding({ role })).toBe(path);
  });

  it("uses useful from pathname", () => {
    expect(
      resolveOnboardingLanding({
        role: "admin",
        fromPathname: "/trips/t-1",
      }),
    ).toBe("/trips/t-1");
  });

  it("includes search when from is useful", () => {
    expect(
      resolveOnboardingLanding({
        role: "accountant",
        fromPathname: "/trips/t-1",
        fromSearch: "?tab=stops",
      }),
    ).toBe("/trips/t-1?tab=stops");
  });

  it.each(["/onboarding", "/login", "/dashboard"] as const)(
    "ignores from %s and uses the house",
    (fromPathname) => {
      expect(
        resolveOnboardingLanding({
          role: "admin",
          fromPathname,
          fromSearch: "?x=1",
        }),
      ).toBe("/settings/billing");
    },
  );

  it("falls back to /trips for an unknown role without useful from", () => {
    expect(resolveOnboardingLanding({ role: "platform_owner" })).toBe("/trips");
  });

  it("founder without useful from lands on billing settings", () => {
    expect(
      resolveOnboardingLanding({ role: "admin", family: "founder" }),
    ).toBe("/settings/billing");
  });

  it("admin staff family lands on billing settings", () => {
    expect(
      resolveOnboardingLanding({ role: "admin", family: "staff" }),
    ).toBe("/settings/billing");
  });

  it("founder useful from still wins over billing house", () => {
    expect(
      resolveOnboardingLanding({
        role: "admin",
        family: "founder",
        fromPathname: "/trips/t-1",
      }),
    ).toBe("/trips/t-1");
  });

  it("founder ignores /dashboard and uses billing house", () => {
    expect(
      resolveOnboardingLanding({
        role: "admin",
        family: "founder",
        fromPathname: "/dashboard",
      }),
    ).toBe("/settings/billing");
  });
});

describe("isUsefulOnboardingFromPath", () => {
  it("rejects empty, relative and blocked paths", () => {
    expect(isUsefulOnboardingFromPath(null)).toBe(false);
    expect(isUsefulOnboardingFromPath("trips")).toBe(false);
    expect(isUsefulOnboardingFromPath("/dashboard")).toBe(false);
  });
});

describe("readOnboardingFromState", () => {
  it("reads pathname and search from the gate location object", () => {
    expect(
      readOnboardingFromState({
        from: { pathname: "/trips/t-1", search: "?q=1", hash: "" },
      }),
    ).toEqual({ fromPathname: "/trips/t-1", fromSearch: "?q=1" });
  });

  it("returns empty for missing or string from", () => {
    expect(readOnboardingFromState(undefined)).toEqual({});
    expect(readOnboardingFromState({ from: "/trips" })).toEqual({});
  });
});
