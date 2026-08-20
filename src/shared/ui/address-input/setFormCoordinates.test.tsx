import { act, renderHook, waitFor } from "@testing-library/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  additionalAddressFormSchema,
  defaultClientAddressFormValues,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";
import { setFormCoordinates } from "./setFormCoordinates";

const coords = { latitude: 22.105205, longitude: -100.94651 };

describe("setFormCoordinates", () => {
  it("writes both coordinates and does not leave the pair error", async () => {
    const { result } = renderHook(() =>
      useForm<ClientAddressFormData>({
        resolver: zodResolver(additionalAddressFormSchema),
        defaultValues: defaultClientAddressFormValues,
        mode: "onChange",
      }),
    );

    await act(async () => {
      await setFormCoordinates(
        result.current.setValue,
        result.current.trigger,
        coords,
      );
    });

    await waitFor(() => {
      expect(result.current.getValues("latitude")).toBe(coords.latitude);
      expect(result.current.getValues("longitude")).toBe(coords.longitude);
      expect(result.current.formState.errors.latitude).toBeUndefined();
    });
  });
});
