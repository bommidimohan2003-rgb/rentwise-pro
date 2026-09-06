import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <AuthLayout
      mode="login"
      title="Welcome Back"
      subtitle="Sign in to manage rentals, access booked gear, or list your equipment."
    >
      <LoginForm />
    </AuthLayout>
  );
}
