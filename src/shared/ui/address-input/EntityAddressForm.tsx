import type { FormEventHandler, ReactNode } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { MapPin } from "lucide-react";
import { AddressFormNotice } from "./AddressFormNotice";
import { resolveAddressFormNotice } from "./addressFormNoticeRules";
import type { AddressFormUiContext } from "./addressFormCopy";
import type { AddressCaptureMode } from "@shared/validation/addressRequirements";

export interface EntityAddressFormSection {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  contentClassName?: string;
  content: ReactNode;
}

export interface EntityAddressFormProps {
  className?: string;
  asForm?: boolean;
  formContext: AddressFormUiContext;
  addressMode?: AddressCaptureMode;
  infoMessage: string;
  satStateCode?: string;
  satMunicipalityCode?: string;
  postalCode?: string;
  hasClientFiscalData?: boolean;
  useClientFiscalData?: boolean;
  showGlobalNotice?: boolean;
  hideLocationSectionTitle?: boolean;
  locationSectionTitle?: string;
  preAddressSections?: EntityAddressFormSection[];
  addressInputSection: ReactNode;
  postAddressSections?: EntityAddressFormSection[];
  children?: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export function EntityAddressForm({
  className,
  asForm = true,
  formContext,
  addressMode = "basic",
  infoMessage,
  satStateCode,
  satMunicipalityCode,
  postalCode,
  hasClientFiscalData = false,
  useClientFiscalData = false,
  showGlobalNotice = true,
  hideLocationSectionTitle = false,
  locationSectionTitle = "Ubicacion SAT y domicilio",
  preAddressSections = [],
  addressInputSection,
  postAddressSections = [],
  children,
  onSubmit,
}: EntityAddressFormProps) {
  const globalNotice = resolveAddressFormNotice(
    {
      context: formContext,
      addressMode,
      satStateCode,
      satMunicipalityCode,
      postalCode,
      hasClientFiscalData,
      useClientFiscalData,
    },
    infoMessage,
  );

  const renderSection = (section: EntityAddressFormSection) => (
    <FormSectionCard
      key={section.id}
      title={section.title}
      icon={section.icon}
      contentClassName={section.contentClassName ?? "space-y-4"}
    >
      {section.content}
    </FormSectionCard>
  );

  const content = (
    <>
      {preAddressSections.map(renderSection)}
      {showGlobalNotice && globalNotice ? (
        <AddressFormNotice notice={globalNotice} />
      ) : null}

      {hideLocationSectionTitle ? (
        <Card>
          <CardContent className="space-y-4 pt-6">{addressInputSection}</CardContent>
        </Card>
      ) : (
        <FormSectionCard
          title={locationSectionTitle}
          icon={<MapPin className="h-4 w-4" />}
          contentClassName="space-y-4"
        >
          {addressInputSection}
        </FormSectionCard>
      )}

      {postAddressSections.map(renderSection)}
      {children}
    </>
  );

  if (!asForm) {
    return <div className={className}>{content}</div>;
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {content}
    </form>
  );
}

