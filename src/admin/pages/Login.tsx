import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { authService } from "../services/auth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@payent.com",
      password: "admin123",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await authService.login(values.email, values.password);
      if (response.success) {
        toast.success(`Welcome back, ${response.user.fullName}!`);
        // Notify other components (like Sidebar/Topbar) to reload user data
        window.dispatchEvent(new Event("payent:admin:profile-updated"));
        navigate({ to: "/admin/dashboard" });
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid email or password.";
      setServerError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient relative overflow-hidden px-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-accent/20 rounded-full blur-[110px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="w-full max-w-md z-10"
      >
        {/* Card */}
        <div className="glass bg-card/65 rounded-3xl p-8 shadow-2xl border border-border/80 relative">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-primary/25 mb-4">
              TR
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
              Welcome back
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1.5">
              Access the Payent Admin Control Panel
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="p-3.5 text-xs font-semibold bg-destructive/10 text-destructive rounded-xl border border-destructive/20 animate-shake">
                {serverError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="admin@payent.com"
                  {...register("email")}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl pl-10 pr-4 py-3.5 border border-border/80 focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-bold text-destructive animate-fade-in pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground tracking-wide">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-primary hover:underline hover:text-primary-foreground"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl pl-10 pr-10 py-3.5 border border-border/80 focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] font-bold text-destructive animate-fade-in pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20 accent-primary"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-xs font-semibold text-muted-foreground select-none"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 btn-gradient font-bold py-3.5 px-4 rounded-xl text-xs mt-3 select-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
