import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  AdminActivationStatus,
  type PlatformAdminActivation,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { OpsTenantActivationPanel } from "./OpsTenantActivationPanel";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  useResendPlatformTenantActivation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const copy = platformCopy.tenants.detail.adminActivation;
const EXPIRES_AT = "2026-08-14T18:00:00.000Z";
const LAST_SENT_AT = "2026-08-07T18:00:00.000Z";
const USED_AT = "2026-08-08T16:30:00.000Z";

function activation(
  overrides: Partial<PlatformAdminActivation> = {},
): PlatformAdminActivation {
  return {
    status: AdminActivationStatus.PENDING,
    email: "admin@acme.mx",
    expiresAt: EXPIRES_AT,
    lastSentAt: LAST_SENT_AT,
    lastSendError: null,
    sendAttempts: 2,
    firstName: "Ana",
    lastName: "López",
    usedAt: null,
    ...overrides,
  };
}

function renderPanel(
  value: PlatformAdminActivation | null,
  canMutate = true,
) {
  return render(
    <OpsTenantActivationPanel
      tenantId="tenant-1"
      activation={value}
      canMutate={canMutate}
    />,
  );
}

describe("OpsTenantActivationPanel", () => {
  it("shows identity and invite facts on an open invitation", () => {
    renderPanel(activation());

    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.statusLabels.pending)).toBeInTheDocument();
    expect(screen.getByText(copy.statusHints.pending)).toBeInTheDocument();
    expect(screen.getByText(copy.fields.name)).toBeInTheDocument();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(screen.getByText(copy.fields.email)).toBeInTheDocument();
    expect(screen.getByText("admin@acme.mx")).toBeInTheDocument();
    expect(screen.getByText(copy.fields.expiresAt)).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(EXPIRES_AT))).toBeInTheDocument();
    expect(screen.getByText(copy.fields.lastSentAt)).toBeInTheDocument();
    expect(screen.getByText(formatDateTime(LAST_SENT_AT))).toBeInTheDocument();
    expect(screen.getByText(copy.fields.sendAttempts)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.queryByText(copy.fields.activatedAt)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.resend }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.rotate }),
    ).toBeInTheDocument();
  });

  it("omits the name row when both names are blank and hides the send error unless email failed", () => {
    renderPanel(
      activation({
        firstName: "  ",
        lastName: null,
        lastSendError: "EMAIL_SEND_FAILED",
      }),
    );

    expect(screen.queryByText(copy.fields.name)).not.toBeInTheDocument();
    expect(screen.queryByText("EMAIL_SEND_FAILED")).not.toBeInTheDocument();
    expect(screen.getByText("admin@acme.mx")).toBeInTheDocument();
  });

  it("shows the send error only when the invite email failed", () => {
    renderPanel(
      activation({
        status: AdminActivationStatus.EMAIL_FAILED,
        lastSendError: "EMAIL_SEND_FAILED",
      }),
    );

    expect(screen.getByText(copy.fields.lastSendError)).toBeInTheDocument();
    expect(screen.getByText("EMAIL_SEND_FAILED")).toBeInTheDocument();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.resend }),
    ).toBeInTheDocument();
  });

  it("keeps an expired invite wide, without the send error", () => {
    renderPanel(
      activation({
        status: AdminActivationStatus.EXPIRED,
        lastSendError: "EMAIL_SEND_FAILED",
        firstName: null,
        lastName: "López",
      }),
    );

    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText("López")).toBeInTheDocument();
    expect(screen.queryByText("EMAIL_SEND_FAILED")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.rotate }),
    ).toBeInTheDocument();
  });

  it("hides resend and rotate when the operator cannot mutate", () => {
    renderPanel(activation(), false);

    expect(
      screen.queryByRole("button", { name: copy.resend }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.rotate }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(copy.readOnlyHint)).toBeInTheDocument();
  });

  it("compacts an activated admin to identity and the activation date", () => {
    renderPanel(
      activation({
        status: AdminActivationStatus.ACTIVATED,
        usedAt: USED_AT,
        lastSendError: "EMAIL_SEND_FAILED",
      }),
      true,
    );

    expect(screen.queryByText(copy.description)).not.toBeInTheDocument();
    expect(screen.getByText(copy.statusLabels.activated)).toBeInTheDocument();
    expect(screen.getByText(copy.statusHints.activated)).toBeInTheDocument();
    expect(screen.getByText("admin@acme.mx")).toBeInTheDocument();
    expect(screen.getByText("Ana López")).toBeInTheDocument();
    expect(
      screen.getByText(`${copy.fields.activatedAt} ${formatDateTime(USED_AT)}`),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.fields.expiresAt)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.fields.sendAttempts)).not.toBeInTheDocument();
    expect(screen.queryByText("EMAIL_SEND_FAILED")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.resend }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.rotate }),
    ).not.toBeInTheDocument();
  });

  it("omits the activation date when usedAt is null", () => {
    renderPanel(
      activation({
        status: AdminActivationStatus.ACTIVATED,
        usedAt: null,
      }),
    );

    expect(screen.getByText(copy.statusLabels.activated)).toBeInTheDocument();
    expect(screen.queryByText(/Activó el/)).not.toBeInTheDocument();
  });

  it("shows the none seal without inventing an email or a date", () => {
    renderPanel(
      activation({
        status: AdminActivationStatus.NONE,
        email: null,
        firstName: null,
        lastName: null,
        usedAt: null,
      }),
    );

    expect(screen.getByText(copy.statusLabels.none)).toBeInTheDocument();
    expect(screen.getByText(copy.statusHints.none)).toBeInTheDocument();
    expect(screen.queryByText(copy.description)).not.toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Activó el/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.resend }),
    ).not.toBeInTheDocument();
  });

  it("shows email and name on none only when the payload brings them", () => {
    renderPanel(
      activation({
        status: AdminActivationStatus.NONE,
        email: "revocada@acme.mx",
        firstName: "Rosa",
        lastName: null,
        usedAt: null,
      }),
    );

    expect(screen.getByText(copy.statusLabels.none)).toBeInTheDocument();
    expect(screen.getByText("revocada@acme.mx")).toBeInTheDocument();
    expect(screen.getByText("Rosa")).toBeInTheDocument();
    expect(screen.queryByText(/Activó el/)).not.toBeInTheDocument();
  });
});
