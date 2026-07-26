import { LegalDocumentPage } from "./LegalDocumentPage";
import { legalCopy } from "./legalCopy";

export default function PrivacyPage() {
  return (
    <LegalDocumentPage
      title={legalCopy.privacy.title}
      description={legalCopy.privacy.description}
      sections={legalCopy.privacy.sections}
    />
  );
}
