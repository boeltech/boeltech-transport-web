import { Navigate } from "react-router-dom";

/** @deprecated Use `/account`. */
export default function ProfilePageRedirect() {
  return <Navigate to="/account" replace />;
}
