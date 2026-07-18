import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/admin/services/auth";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import type { User } from "@/types";

const schema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  const onSubmit = async (data: FormValues) => {
    setError(null);

    // 1. First, check if logging in with mock admin credentials
    if (data.email === "admin@payent.com" && data.password === "admin123") {
      try {
        const adminRes = await authService.login(data.email, data.password);
        if (adminRes.success) {
          // Set regular user storage session so the main site knows we are logged in as admin
          storage.set(STORAGE_KEYS.token, adminRes.token);
          const loggedUser: User = {
            id: adminRes.user.email,
            fullName: adminRes.user.fullName,
            email: adminRes.user.email,
            role: "admin",
          };
          storage.set(STORAGE_KEYS.currentUser, loggedUser);

          // Dispatch profile update event for admin dashboard
          window.dispatchEvent(new Event("payent:admin:profile-updated"));
          navigate({ to: "/admin/dashboard" });
          return;
        }
      } catch (err: unknown) {
        console.error(err);
        setError("Admin authentication failed.");
        return;
      }
    }

    // 2. Otherwise, login as a normal user (or a db-defined admin)
    const res = await login(data.email, data.password);
    if (!res.ok) return setError(res.error ?? "Unable to login");

    // 3. Synchronously inspect storage to see if the logged-in user has the admin role
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
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" className="rounded" {...register("remember")} />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => navigate({ to: "/forgot-password" })}
          className="text-primary hover:underline"
        >
          Forgot password?
        </button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Login
      </Button>
    </form>
  );
}
