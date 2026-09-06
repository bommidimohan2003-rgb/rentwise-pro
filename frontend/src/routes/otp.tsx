import { createFileRoute } from "@tanstack/react-router";
import OTP from "@/pages/OTP";
import { getSeoMetadata } from "@/utils/seo";

export const Route = createFileRoute("/otp")({
  head: () =>
    getSeoMetadata({
      title: "Verify OTP | Payent",
      description:
        "Enter the verification code sent to your email to complete your authentication.",
      path: "/otp",
    }),
  component: OTP,
});
