import { MainLayout } from "@/layouts/MainLayout";
import { OTPVerification } from "@/components/auth/OTPVerification";

export default function OTP() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-md px-4 md:px-6 py-16">
        <div className="card-premium p-8">
          <h1 className="text-3xl font-bold">Enter verification code</h1>
          <p className="mt-1 text-sm text-muted-foreground">A 6-digit code was sent to your email. Check the browser console in demo mode.</p>
          <div className="mt-8"><OTPVerification /></div>
        </div>
      </section>
    </MainLayout>
  );
}
