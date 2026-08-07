import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Building2,
  Compass,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { toast } from "sonner";

const schema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name (at least 2 letters)")
      .max(100),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address")
      .max(255),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number (at least 7 digits)")
      .max(20),
    address: z
      .string()
      .trim()
      .min(5, "Enter complete street address (at least 5 characters)"),
    city: z.string().trim().min(2, "Enter city name"),
    pincode: z.string().trim().min(6, "Enter valid 6-digit PIN code").max(10),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Please accept the Terms & Privacy Policy" }),
    }),
    isAdmin: z.boolean().optional(),
    adminCode: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords don't match",
  })
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
  const { user, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate({ to: "/categories" });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const pw = watch("password") ?? "";
  const watchIsAdmin = watch("isAdmin") ?? false;
  const level = useMemo(() => strength(pw), [pw]);
  const labels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

  const showAdminOption = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      if (
        key.trim().toLowerCase() === "admin" &&
        value.trim().toLowerCase() === "true"
      ) {
        return true;
      }
    }
    return false;
  }, []);

  const onSubmit = async (data: FormValues) => {
    setErrorState(null);
    const res = await registerUser(data.email, data.phone);
    if (!res.ok) {
      const msg = res.error ?? "Failed to initiate registration";
      if (msg.toLowerCase().includes("email")) {
        setError("email", { type: "server", message: msg });
      } else if (msg.toLowerCase().includes("phone")) {
        setError("phone", { type: "server", message: msg });
      } else {
        setErrorState(msg);
      }
      return;
    }

    const pendingUser = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      password: data.password,
      adminCode: showAdminOption && data.isAdmin ? data.adminCode : undefined,
    };

    storage.set(STORAGE_KEYS.pendingUser, pendingUser);
    storage.set(STORAGE_KEYS.otpEmail, data.email);

    toast.success("Verification code sent via SMS!");
    navigate({ to: "/otp" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      {/* Section 1: Account & Contact Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-wider">
          <User className="h-3.5 w-3.5" />
          <span>Account & Contact Info</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            placeholder="Aarav Sharma"
            icon={<User className="h-4 w-4" />}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="aarav@creator.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
      </div>

      {/* Section 2: Address & Phone */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-wider">
          <MapPin className="h-3.5 w-3.5" />
          <span>Address & Phone</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
          <div className="sm:col-span-7">
            <Input
              label="Street Address / House No"
              placeholder="123 Indiranagar, 100ft Road"
              icon={<MapPin className="h-4 w-4" />}
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="City"
            placeholder="Bengaluru"
            icon={<Building2 className="h-4 w-4" />}
            error={errors.city?.message}
            {...register("city")}
          />
          <Input
            label="PIN Code"
            placeholder="560038"
            icon={<Compass className="h-4 w-4" />}
            error={errors.pincode?.message}
            {...register("pincode")}
          />
        </div>
      </div>

      {/* Section 3: Password & Security */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-wider">
          <Lock className="h-3.5 w-3.5" />
          <span>Security Password</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="At least 8 characters"
            icon={<Lock className="h-4 w-4" />}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            error={errors.password?.message}
            {...register("password")}
          />

          <Input
            label="Confirm Password"
            type={showPw ? "text" : "password"}
            placeholder="Repeat password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirm?.message}
            {...register("confirm")}
          />
        </div>
      </div>

      {/* Password Strength Indicator */}
      {pw && (
        <div className="space-y-1 p-2.5 rounded-xl bg-secondary/50 border border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Password Security:
            </span>
            <span className="font-bold text-foreground">{labels[level]}</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${(level / 4) * 100}%`,
                backgroundColor:
                  level < 2
                    ? "#E63946"
                    : level < 3
                      ? "#F59E0B"
                      : level < 4
                        ? "#3B82F6"
                        : "#10B981",
              }}
            />
          </div>
        </div>
      )}

      {showAdminOption && (
        <div className="space-y-2 p-2.5 rounded-xl bg-secondary border border-border">
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-foreground">
            <input
              type="checkbox"
              className="rounded border-border text-primary focus:ring-primary"
              {...register("isAdmin")}
            />
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Register as site administrator</span>
          </label>

          {watchIsAdmin && (
            <Input
              label="Admin Setup Code"
              placeholder="Enter admin key"
              icon={<Lock className="h-4 w-4" />}
              error={errors.adminCode?.message}
              {...register("adminCode")}
            />
          )}
        </div>
      )}

      {/* Terms & Action Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-border text-primary focus:ring-primary"
            {...register("terms")}
          />
          <span className="text-muted-foreground text-[11px]">
            I accept the{" "}
            <a href="#" className="text-foreground hover:underline font-bold">
              Terms
            </a>{" "}
            &{" "}
            <a href="#" className="text-foreground hover:underline font-bold">
              Privacy Policy
            </a>
          </span>
        </label>

        <Button
          type="submit"
          className="w-full sm:w-auto px-7 font-extrabold h-11 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <span>
            {isSubmitting ? "Creating..." : "Create Account & Verify"}
          </span>
          {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {errors.terms && (
        <p className="text-xs text-destructive font-medium">
          {errors.terms.message}
        </p>
      )}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </form>
  );
}
