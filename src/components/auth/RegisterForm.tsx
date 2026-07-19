import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { toast } from "sonner";
import type { User as UserType } from "@/types";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().email("Invalid email").max(255),
    phone: z.string().trim().min(7, "Enter a valid phone").max(20),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "Please accept the terms" }) }),
    isAdmin: z.boolean().optional(),
    adminCode: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" })
  .refine((d) => !d.isAdmin || (d.adminCode && d.adminCode.trim().length > 0), {
    path: ["adminCode"],
    message: "Admin setup code is required",
  });

type FormValues = z.infer<typeof schema>;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const pw = watch("password") ?? "";
  const watchIsAdmin = watch("isAdmin") ?? false;
  const level = useMemo(() => strength(pw), [pw]);
  const labels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const res = await registerUser(data.email, data.phone);
    if (!res.ok) {
      return setError(res.error ?? "Failed to initiate registration");
    }

    const pendingUser = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      adminCode: data.isAdmin ? data.adminCode : undefined,
    };

    // Save registration details to pending state to complete verification in OTP step
    storage.set(STORAGE_KEYS.pendingUser, pendingUser);
    storage.set(STORAGE_KEYS.otpEmail, data.email);

    toast.success("Verification code sent via SMS!");
    navigate({ to: "/otp" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full name"
        placeholder="Jane Doe"
        icon={<User className="h-4 w-4" />}
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@work.com"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Phone"
        placeholder="+1 555 123 4567"
        icon={<Phone className="h-4 w-4" />}
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        label="Password"
        type={showPw ? "text" : "password"}
        icon={<Lock className="h-4 w-4" />}
        rightAdornment={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        error={errors.password?.message}
        {...register("password")}
      />
      {pw && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(level / 4) * 100}%`,
                backgroundColor:
                  level < 2
                    ? "oklch(0.65 0.22 27)"
                    : level < 3
                      ? "oklch(0.75 0.18 60)"
                      : "oklch(0.65 0.2 145)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Strength: {labels[level]}</p>
        </div>
      )}
      <Input
        label="Confirm password"
        type={showPw ? "text" : "password"}
        icon={<Lock className="h-4 w-4" />}
        error={errors.confirm?.message}
        {...register("confirm")}
      />
      <div className="space-y-4 pt-2 border-t border-border/40">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" {...register("isAdmin")} />
          <span className="text-foreground">Register as site administrator</span>
        </label>
        
        {watchIsAdmin && (
          <Input
            label="Admin Setup Code"
            placeholder="Enter setup code"
            icon={<Lock className="h-4 w-4" />}
            error={errors.adminCode?.message}
            {...register("adminCode")}
          />
        )}
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" {...register("terms")} />
        <span className="text-muted-foreground">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  );
}
