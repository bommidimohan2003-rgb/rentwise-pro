import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { toast } from "sonner";
import type { User } from "@/types";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [error, setErrorState] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { remember: true },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const notice = sessionStorage.getItem("payent_session_expired_notice");
      if (notice) {
        setSessionNotice(notice);
        sessionStorage.removeItem("payent_session_expired_notice");
      }
    }
  }, []);

  const onSubmit = async (data: FormValues) => {
    setErrorState(null);

    const res = await login(data.email, data.password);
    if (!res.ok) {
      const msg = res.error ?? "Invalid email or password.";
      if (msg.toLowerCase().includes("password")) {
        setError("password", { type: "server", message: msg });
      } else if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("user")) {
        setError("email", { type: "server", message: msg });
      } else {
        setErrorState(msg);
      }
      return;
    }

    toast.success("Signed in successfully!");

    const currentUser = storage.get<User | null>(STORAGE_KEYS.currentUser, null);
    if (currentUser?.role === "admin") {
      const userToken = storage.get<string | null>(STORAGE_KEYS.token, null);
      localStorage.setItem("payent:admin:token", userToken || "mock-admin-token");
      localStorage.setItem(
        "payent:admin:current_user",
        JSON.stringify({
          id: currentUser.id,
          fullName: currentUser.fullName,
          email: currentUser.email,
          role: "admin",
          status: "active",
          verified: true,
        })
      );
      window.dispatchEvent(new Event("payent:admin:profile-updated"));
      navigate({ to: "/admin/dashboard" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {sessionNotice && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{sessionNotice}</span>
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="you@work.com"
        icon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type={showPw ? "text" : "password"}
        placeholder="••••••••"
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
      <div className="flex items-center justify-between text-sm">
        <label className="inline-flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
          <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" {...register("remember")} />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => navigate({ to: "/forgot-password" })}
          className="text-primary hover:underline font-semibold"
        >
          Forgot password?
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      <Button type="submit" className="w-full font-bold" loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
