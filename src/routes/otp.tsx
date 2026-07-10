import { createFileRoute } from "@tanstack/react-router";
import OTP from "@/pages/OTP";

export const Route = createFileRoute("/otp")({
  head: () => ({ meta: [{ title: "Verify code · TechRent" }] }),
  component: OTP,
});
