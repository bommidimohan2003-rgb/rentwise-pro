import { Link } from "@tanstack/react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { ForgotPassword as Form } from "@/components/auth/ForgotPassword";

export default function ForgotPassword() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-md px-4 md:px-6 py-16">
        <div className="card-premium p-8">
          <h1 className="text-3xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll email you a 6-digit code.</p>
          <div className="mt-8"><Form /></div>
          <p className="mt-6 text-sm text-center text-muted-foreground">
            Remembered? <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
