import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import type { EligibleTripInvoiceScope } from "../helpers/listEligibleTripInvoiceScopes";
import { TripInvoiceScopeDecisionSheet } from "./TripInvoiceScopeDecisionSheet";

const copy = tripFiscalCopy.scopeDecisionSheet;

const multiScopes: EligibleTripInvoiceScope[] = [
  {
    kind: "primary_transport",
    destinations: [{ href: "/invoices/new?trip_id=t1" }],
  },
  {
    kind: "accessory",
    destinations: [{ href: "/invoices/new?trip_id=t1&scope=accessory" }],
  },
];

const splitScopes: EligibleTripInvoiceScope[] = [
  {
    kind: "split_share",
    destinations: [
      {
        href: "/invoices/new?trip_id=t1&scope=split_share&leg_id=a",
        legId: "a",
        legLabel: "Cliente A",
      },
      {
        href: "/invoices/new?trip_id=t1&scope=split_share&leg_id=b",
        legId: "b",
        legLabel: "Cliente B",
      },
    ],
  },
];

describe("TripInvoiceScopeDecisionSheet", () => {
  it("full: muestra título, opciones elegibles y hint cancel≠falso", () => {
    render(
      <TripInvoiceScopeDecisionSheet
        open
        onOpenChange={vi.fn()}
        scopes={multiScopes}
        variant="full"
        onSelectHref={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.optionPrimary)).toBeInTheDocument();
    expect(screen.getByText(copy.optionAccessory)).toBeInTheDocument();
    expect(screen.getByText(copy.cancelVsFalseHint)).toBeInTheDocument();
    expect(screen.queryByText(copy.optionFalseTrip)).not.toBeInTheDocument();
  });

  it("split_legs: solo lista porciones y navega al elegir", async () => {
    const user = userEvent.setup();
    const onSelectHref = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TripInvoiceScopeDecisionSheet
        open
        onOpenChange={onOpenChange}
        scopes={splitScopes}
        variant="split_legs"
        onSelectHref={onSelectHref}
      />,
    );

    expect(
      screen.getByRole("heading", { name: copy.splitLegsTitle }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.cancelVsFalseHint)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(copy.optionSplitShare("Cliente A"), "i"),
      }),
    );

    expect(onSelectHref).toHaveBeenCalledWith(
      "/invoices/new?trip_id=t1&scope=split_share&leg_id=a",
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("no inventa opciones ausentes en scopes", () => {
    render(
      <TripInvoiceScopeDecisionSheet
        open
        onOpenChange={vi.fn()}
        scopes={[multiScopes[0]!]}
        variant="full"
        onSelectHref={vi.fn()}
      />,
    );

    expect(screen.getByText(copy.optionPrimary)).toBeInTheDocument();
    expect(screen.queryByText(copy.optionAccessory)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.optionFalseTrip)).not.toBeInTheDocument();
  });
});
