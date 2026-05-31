import type { FormEventHandler, ReactNode } from "react";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { MapPin } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { ADDRESS_INPUT_CONTAINER_CLASS } from "./addressInputContainer";
import { AddressFormNotice } from "./AddressFormNotice";
import { resolveAddressFormNotice } from "./addressFormNoticeRules";
import type { AddressFormUiContext } from "./addressFormCopy";
import type { AddressUxVariant } from "@shared/validation/addressRequirements";

export interface EntityAddressFormSection {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  contentClassName?: string;
  content: ReactNode;
  /**
   * `plain`: mismo contenedor que `AddressInput` (`rounded-lg border p-4`), sin Card ni separador.
   * `card`: `FormSectionCard` clásico.
   */
  surface?: "card" | "plain";
  className?: string;
}

export interface EntityAddressFormProps {
  className?: string;
  asForm?: boolean;
  formContext: AddressFormUiContext;
  addressVariant?: AddressUxVariant;
  addressType?: string | null;
  infoMessage: string;
  satStateCode?: string;
  satMunicipalityCode?: string;
  postalCode?: string;
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
  addressVariant: addressVariantProp,
  addressType,
  infoMessage,
  satStateCode,
  satMunicipalityCode,
  postalCode,
  showGlobalNotice = true,
  hideLocationSectionTitle = false,
  locationSectionTitle = "Domicilio",
  preAddressSections = [],
  addressInputSection,
  postAddressSections = [],
  children,
  onSubmit,
}: EntityAddressFormProps) {
  const addressVariant = addressVariantProp ?? "carta-porte";

  const globalNotice = resolveAddressFormNotice(
    {
      context: formContext,
      addressVariant,
      addressType,
      satStateCode,
      satMunicipalityCode,
      postalCode,
    },
    infoMessage,
  );

  const renderSection = (section: EntityAddressFormSection) => {
    if (section.surface === "plain") {
      return (
        <section
          key={section.id}
          className={cn(ADDRESS_INPUT_CONTAINER_CLASS, section.className)}
          aria-labelledby={`${section.id}-heading`}
        >
          <div
            id={`${section.id}-heading`}
            className="flex items-center gap-2 text-sm font-medium leading-none"
          >
            {section.icon ? (
              <span className="text-muted-foreground">{section.icon}</span>
            ) : null}
            {section.title}
          </div>
          <div className={section.contentClassName ?? "space-y-4"}>{section.content}</div>
        </section>
      );
    }

    return (
      <FormSectionCard
        key={section.id}
        title={section.title}
        icon={section.icon}
        contentClassName={section.contentClassName ?? "space-y-4"}
      >
        {section.content}
      </FormSectionCard>
    );
  };

  const content = (
    <>
      {preAddressSections.map(renderSection)}
      {showGlobalNotice && globalNotice ? (
        <AddressFormNotice notice={globalNotice} />
      ) : null}

      {hideLocationSectionTitle ? (
        <div className="space-y-4">{addressInputSection}</div>
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

