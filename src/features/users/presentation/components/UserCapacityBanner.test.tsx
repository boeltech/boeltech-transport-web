import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { usersCopy } from "../copy/usersCopy";
import { resolveUserPlanCapacity } from "../helpers/userPlanCapacity";
import { UserCapacityBanner } from "./UserCapacityBanner";
import { UserPlanLimitNotice } from "./UserPlanLimitNotice";

describe("UserCapacityBanner", () => {
  it("muestra X de Y cuando el plan tiene tope", () => {
    render(
      <UserCapacityBanner capacity={resolveUserPlanCapacity(3, 5)} />,
    );
    expect(
      screen.getByText(usersCopy.list.capacity.limited(3, 5)),
    ).toBeInTheDocument();
  });

  it("muestra sin límite cuando maxUsers es null", () => {
    render(
      <UserCapacityBanner capacity={resolveUserPlanCapacity(12, null)} />,
    );
    expect(
      screen.getByText(usersCopy.list.capacity.unlimited(12)),
    ).toBeInTheDocument();
  });

  it("no muestra nada mientras el cupo no resuelve", () => {
    const { container } = render(
      <UserCapacityBanner capacity={resolveUserPlanCapacity(4, undefined)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("UserPlanLimitNotice", () => {
  it("avisa al llegar al tope con enlace a Plan y consumo", () => {
    render(
      <MemoryRouter>
        <UserPlanLimitNotice capacity={resolveUserPlanCapacity(3, 3)} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(usersCopy.list.limitNotice.reachedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(usersCopy.list.limitNotice.reachedDescription(3)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: usersCopy.list.limitNotice.billingCta,
      }),
    ).toHaveAttribute("href", "/settings/subscription");
  });

  it("no se muestra con plazas libres", () => {
    const { container } = render(
      <MemoryRouter>
        <UserPlanLimitNotice capacity={resolveUserPlanCapacity(2, 5)} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("no se muestra con plan ilimitado", () => {
    const { container } = render(
      <MemoryRouter>
        <UserPlanLimitNotice capacity={resolveUserPlanCapacity(40, null)} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
