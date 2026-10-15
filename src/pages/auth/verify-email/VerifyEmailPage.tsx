import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@shared/ui/button";
import { tokenStorage } from "@features/auth/infrastructure";
import { AuthFunnelStatusBlock } from "../AuthFunnelStatusBlock";
import { useVerifyEmail } from "./useVerifyEmail";
import { verifyEmailCopy as copy } from "./verifyEmailCopy";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isMissingToken, isLoading, isSuccess, isError, errorMessage } =
    useVerifyEmail(token);

  if (isSuccess) {
    const hasLocalSession = tokenStorage.hasSession();
    return (
      <AuthFunnelStatusBlock
        variant="success"
        icon={<CheckCircle className="h-8 w-8" aria-hidden />}
        title={copy.success.title}
        description={copy.success.body}
      >
        <div className="flex w-full flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link to="/login">{copy.success.goLogin}</Link>
          </Button>
          {hasLocalSession ? (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/dashboard">{copy.success.goDashboard}</Link>
            </Button>
          ) : null}
        </div>
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
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/login">{copy.error.goLogin}</Link>
        </Button>
      </AuthFunnelStatusBlock>
    );
  }

  return (
    <AuthFunnelStatusBlock variant="loading" loadingLabel={copy.loading} />
  );
};

export default VerifyEmailPage;
