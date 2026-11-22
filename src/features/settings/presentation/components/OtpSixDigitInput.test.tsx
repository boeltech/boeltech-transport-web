import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OtpSixDigitInput } from "./OtpSixDigitInput";

describe("OtpSixDigitInput", () => {
  it("emits digits as the user types across cells", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <OtpSixDigitInput value="" onChange={onChange} autoFocus />,
    );

    const first = screen.getByLabelText(/dígito 1 de 6/i);
    await user.type(first, "4");
    expect(onChange).toHaveBeenLastCalledWith("4");

    rerender(<OtpSixDigitInput value="4" onChange={onChange} />);
    const second = screen.getByLabelText(/dígito 2 de 6/i);
    await user.type(second, "8");
    expect(onChange).toHaveBeenLastCalledWith("48");
  });

  it("accepts a full paste into the first cell", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpSixDigitInput value="" onChange={onChange} />);

    const first = screen.getByLabelText(/dígito 1 de 6/i);
    await user.click(first);
    await user.paste("481029");
    expect(onChange).toHaveBeenCalledWith("481029");
  });
});
