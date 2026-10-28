import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import {
  clearOpsThemeBridge,
  registerOpsThemeBridge,
} from "@/features/platform/presentation/ops/opsThemeBridge";
import { Toaster } from "./Toaster";

const captured = vi.hoisted(() => ({
  props: null as {
    richColors?: boolean;
    offset?: { top?: number };
    mobileOffset?: { top?: number };
    toastOptions?: {
      style?: { boxShadow?: string };
      classNames?: { toast?: string; closeButton?: string };
    };
  } | null,
}));

vi.mock("sonner", () => ({
  Toaster: (props: NonNullable<(typeof captured)["props"]>) => {
    captured.props = props;
    return <div data-testid="sonner-stub" />;
  },
}));

describe("Toaster ops bridge", () => {
  afterEach(() => {
    clearOpsThemeBridge();
    captured.props = null;
  });

  it("keeps ERP rich colors, shadow and 80px offset without the bridge", () => {
    renderWithTheme(<Toaster />);

    expect(captured.props?.richColors).toBe(true);
    expect(captured.props?.offset?.top).toBe(80);
    expect(captured.props?.mobileOffset?.top).toBe(72);
    expect(captured.props?.toastOptions?.classNames?.toast).toContain("shadow-lg");
    expect(captured.props?.toastOptions?.classNames?.toast).toContain("!bg-card");
  });

  it("drops rich colors, shadow and the ERP offset when Ops theme is bridged", () => {
    registerOpsThemeBridge("dark");
    renderWithTheme(<Toaster />);

    expect(captured.props?.richColors).toBe(false);
    expect(captured.props?.offset?.top).toBe(50);
    expect(captured.props?.mobileOffset?.top).toBe(50);
    expect(captured.props?.toastOptions?.style?.boxShadow).toBe("none");
    expect(captured.props?.toastOptions?.classNames?.toast).not.toContain(
      "shadow-lg",
    );
    expect(captured.props?.toastOptions?.classNames?.toast).not.toContain(
      "bg-card",
    );
    expect(captured.props?.toastOptions?.classNames?.closeButton).not.toContain(
      "bg-card",
    );
  });
});
