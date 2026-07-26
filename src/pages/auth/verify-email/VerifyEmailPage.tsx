import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@shared/ui/button";
import { AuthFunnelFormHeader } from "../AuthFunnelFormHeader";
import { AuthFunnelStatusBlock } from "../AuthFunnelStatusBlock";
import { useVerifyEmail } from "./useVerifyEmail";
import { verifyEmailCopy as copy } from "./verifyEmailCopy";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isMissingToken, isLoading, isSuccess, isError, errorMessage } =
    useVerifyEmail(token);

  return (
    <div className="w-full">
      <AuthFunnelFormHeader title={copy.title} description={copy.description} />

      {isLoading ? (
        <AuthFunnelStatusBlock variant="loading" loadingLabel={copy.loading} />
      ) : null}

      {isSuccess ? (
        <AuthFunnelStatusBlock
          variant="success"
          icon={<CheckCircle className="h-8 w-8" aria-hidden />}
          title={copy.success.title}
          description={copy.success.body}
        >
          <Button asChild size="lg" className="w-full">
            <Link to="/dashboard">{copy.success.goDashboard}</Link>
          </Button>
        </AuthFunnelStatusBlock>
      ) : null}

      {(isError || isMissingToken) && !isLoading ? (
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
      ) : null}
    </div>
  );
};

export default VerifyEmailPage;
