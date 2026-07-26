import { LegalDocumentPage } from "./LegalDocumentPage";
import { legalCopy } from "./legalCopy";

export default function TermsPage() {
  return (
    <LegalDocumentPage
      title={legalCopy.terms.title}
      description={legalCopy.terms.description}
      sections={legalCopy.terms.sections}
    />
  );
}
