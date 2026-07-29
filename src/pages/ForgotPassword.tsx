import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPassword as Form } from "@/components/auth/ForgotPassword";

export default function ForgotPassword() {
  return (
    <AuthLayout
      mode="forgot-password"
      title="Reset Your Password"
      subtitle="Enter your account email to receive a 6-digit verification code."
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
