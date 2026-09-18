import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPassword as Form } from "@/components/auth/ForgotPassword";

export default function ForgotPassword() {
  return (
    <AuthLayout
      mode="forgot-password"
      title="Reset Password"
      subtitle="Enter your email to verify your identity and set a new password."
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
