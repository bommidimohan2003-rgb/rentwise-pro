import { MainLayout } from "@/layouts/MainLayout";
import { OTPVerification } from "@/components/auth/OTPVerification";

export default function OTP() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-md px-4 md:px-6 py-16">
        <div className="card-premium p-8">
          <h1 className="text-3xl font-bold">Enter verification code</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A 6-digit verification code was sent via Twilio SMS to your
            registered mobile phone.
          </p>
          <div className="mt-8">
            <OTPVerification />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
