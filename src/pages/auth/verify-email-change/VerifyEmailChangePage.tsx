import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle } from "lucide-react";

import { Button } from "@shared/ui/button";
import { AuthFunnelStatusBlock } from "../AuthFunnelStatusBlock";
import { useConfirmEmailChange } from "./useConfirmEmailChange";
import { verifyEmailChangeCopy as copy } from "./verifyEmailChangeCopy";

const VerifyEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isMissingToken, isLoading, isSuccess, isError, errorMessage } =
    useConfirmEmailChange(token);

  if (isSuccess) {
    return (
      <AuthFunnelStatusBlock
        variant="success"
        icon={<CheckCircle className="h-8 w-8" aria-hidden />}
        title={copy.success.title}
        description={copy.success.body}
      >
        <Button asChild size="lg" className="w-full">
          <Link to="/login">{copy.success.goLogin}</Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  if ((isError || isMissingToken) && !isLoading) {
    return (
      <AuthFunnelStatusBlock
        variant="error"
        icon={<AlertCircle className="h-8 w-8" aria-hidden />}
        title={copy.error.title}
        description={errorMessage || copy.error.fallback}
      >
        <div className="flex w-full flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link to="/account">{copy.error.requestAnother}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/login">{copy.error.goLogin}</Link>
          </Button>
        </div>
      </AuthFunnelStatusBlock>
    );
  }

  return (
    <AuthFunnelStatusBlock variant="loading" loadingLabel={copy.loading} />
  );
};

export default VerifyEmailChangePage;
