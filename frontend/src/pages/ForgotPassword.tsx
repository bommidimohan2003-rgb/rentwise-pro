import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPassword as Form } from "@/components/auth/ForgotPassword";

export default function ForgotPassword() {
  return (
    <AuthLayout
      mode="forgot-password"
      title="Direct Password Reset"
      subtitle="Enter your registered account email and your new password to update credentials directly."
    >
      <Form />
      <p className="mt-4 text-xs text-center text-muted-foreground font-medium">
        Remembered your password?{" "}
        <Link to="/login" className="text-foreground font-bold hover:underline">
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
