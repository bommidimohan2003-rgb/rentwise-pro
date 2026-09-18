import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { toast } from "sonner";
import { api } from "@/utils/api";

export function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Request Verification Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.forgotPasswordRequest(cleanEmail);
      if (res?.otp) {
        setDemoOtp(res.otp);
        setOtp(res.otp); // Pre-fill OTP if returned for demo/testing mode
      }
      toast.success(res?.message || `6-digit verification code sent to ${cleanEmail}.`);
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to request password reset. Please check your email.");
      toast.error(msg || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setResending(true);
    setError(null);

    try {
      const res = await api.forgotPasswordRequest(cleanEmail);
      if (res?.otp) {
        setDemoOtp(res.otp);
        setOtp(res.otp);
      }
      toast.success(res?.message || `A new verification code has been sent.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to resend code.");
      toast.error(msg || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify Code and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.forgotPasswordReset(cleanEmail, cleanOtp, newPassword);
      toast.success("Password updated successfully! Please sign in with your new password.");
      navigate({ to: "/login" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to update password. Please check the verification code.");
      toast.error(msg || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <form onSubmit={handleRequestOtp} className="space-y-5">
        <Input
          label="Account Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          icon={<Mail className="h-4 w-4 text-muted-foreground" />}
          required
        />

        {error && (
          <div className="p-3 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md"
          loading={loading}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Send Verification Code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-5">
      <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/50 rounded-xl text-xs">
        <div className="flex items-center space-x-2 truncate">
          <Mail className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate">{email}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep(1);
            setError(null);
          }}
          className="text-primary font-bold hover:underline shrink-0 ml-2 cursor-pointer"
        >
          Change
        </button>
      </div>

      <div className="space-y-1.5">
        <Input
          label="Verification Code (OTP)"
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          maxLength={10}
          onChange={(e) => {
            setOtp(e.target.value);
            setError(null);
          }}
          icon={<KeyRound className="h-4 w-4 text-muted-foreground" />}
          required
        />
        {demoOtp && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-1">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Test/Demo Code: <strong>{demoOtp}</strong></span>
          </div>
        )}
      </div>

      <div className="relative">
        <Input
          label="New Password"
          type={showPassword ? "text" : "password"}
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError(null);
          }}
          icon={<Lock className="h-4 w-4 text-muted-foreground" />}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <Input
        label="Confirm New Password"
        type={showPassword ? "text" : "password"}
        placeholder="Re-enter your new password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setError(null);
        }}
        icon={<Lock className="h-4 w-4 text-muted-foreground" />}
        required
      />

      {error && (
        <div className="p-3 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md"
        loading={loading}
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Update Password & Sign In
      </Button>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resending}
          className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
          {resending ? "Resending code..." : "Didn't receive code? Resend Code"}
        </button>
      </div>
    </form>
  );
}
