import { Link, useLocation } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPassword as Form } from "@/components/auth/ForgotPassword";

export default function ForgotPassword() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const title = token ? "Create New Password" : "Reset Password";
  const subtitle = token
    ? "Enter your new password below to secure your account."
    : "Enter your registered email to continue.";

  return (
    <AuthLayout
      mode={token ? "reset-password" : "forgot-password"}
      title={title}
      subtitle={subtitle}
    >
      <Form />
      {!token && (
        <p className="mt-4 text-xs text-center text-muted-foreground font-medium">
          Remembered your password?{" "}
          <Link to="/login" className="text-foreground font-bold hover:underline">
            Back to Sign In
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}
