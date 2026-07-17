import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { toast } from "sonner";
import { api } from "@/utils/api";

const schema = z.object({ email: z.string().trim().email("Invalid email") });
type FormValues = z.infer<typeof schema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await api.forgotPasswordRequest(data.email);
      storage.set(STORAGE_KEYS.otpEmail, data.email);
      storage.remove(STORAGE_KEYS.pendingUser); // Distinguish from sign up flow

      toast.success("Password reset code sent via SMS!");
      navigate({ to: "/otp" });
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to request password reset.");
    }
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
