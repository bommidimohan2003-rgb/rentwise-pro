import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function Register() {
  return (
    <AuthLayout
      mode="register"
      title="Create Your Account"
      subtitle="Join 50,000+ creators renting and earning on Payent. Insured up to ₹5 Lakhs."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
