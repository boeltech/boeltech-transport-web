import { AlertWithIcon } from "@shared/ui/alert";
import type { AddressFormNoticeData } from "./addressFormNoticeRules";

interface AddressFormNoticeProps {
  notice: AddressFormNoticeData;
}

export function AddressFormNotice({ notice }: AddressFormNoticeProps) {
  const variant =
    notice.level === "error"
      ? "destructive"
      : notice.level === "warning"
        ? "warning"
        : "info";

  return <AlertWithIcon variant={variant}>{notice.message}</AlertWithIcon>;
}

