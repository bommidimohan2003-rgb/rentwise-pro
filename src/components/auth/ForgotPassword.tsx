import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { STORAGE_KEYS, storage } from "@/utils/storage";

const schema = z.object({ email: z.string().trim().email("Invalid email") });
type FormValues = z.infer<typeof schema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormValues) => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    storage.set(STORAGE_KEYS.otp, otp);
    storage.set(STORAGE_KEYS.otpEmail, data.email);
    // eslint-disable-next-line no-console
    console.info("[TechRent] OTP (demo):", otp);
    navigate({ to: "/otp" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@work.com"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Send code
      </Button>
    </form>
  );
}
