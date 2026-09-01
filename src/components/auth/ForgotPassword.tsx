import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { toast } from "sonner";
import { api } from "@/utils/api";

export function ForgotPassword() {
  const navigate = useNavigate();

  // Stage 1: "request", Stage 2: "reset"
  const [stage, setStage] = useState<"request" | "reset">("request");

  // Form States
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(60);

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Timer countdown for resend
  useEffect(() => {
    if (stage !== "reset" || resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, resendSeconds]);

  // Handle requesting OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.forgotPasswordRequest(cleanEmail);
      storage.set(STORAGE_KEYS.otpEmail, cleanEmail);
      storage.remove(STORAGE_KEYS.pendingUser);

      if (res && res.otp) {
        toast.success(`Verification code sent to ${cleanEmail}! (Code: ${res.otp})`, {
          duration: 10000,
        });
      } else {
        toast.success(`Verification code sent to ${cleanEmail}!`);
      }

      setStage("reset");
      setResendSeconds(60);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to send reset code.");
      toast.error(msg || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleDigitChange = (index: number, value: string) => {
    const numericVal = value.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = numericVal;
      return next;
    });
    setError(null);
    if (numericVal && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle direct password reset submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join("");

    if (otpCode.length < 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.forgotPasswordReset(email.trim().toLowerCase(), otpCode, newPassword);
      storage.remove(STORAGE_KEYS.otp);
      storage.remove(STORAGE_KEYS.otpEmail);

      toast.success("Password changed successfully! Signing you in...");
      navigate({ to: "/login" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Invalid or expired verification code.");
      toast.error(msg || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {stage === "request" ? (
        /* STAGE 1: ENTER EMAIL TO REQUEST OTP */
        <form onSubmit={handleSendOTP} className="space-y-5">
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
            Send Verification Code to Email
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>
      ) : (
        /* STAGE 2: ENTER EMAIL OTP & CHANGE PASSWORD DIRECTLY */
        <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in duration-200">
          {/* Email Info Badge */}
          <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate max-w-[200px]">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStage("request");
                setError(null);
                setOtpDigits(Array(6).fill(""));
              }}
              className="text-primary font-bold hover:underline shrink-0"
            >
              Change Email
            </button>
          </div>

          {/* 6-DIGIT EMAIL OTP INPUT */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
              6-Digit Email OTP Code
            </label>
            <div className="flex justify-between gap-2">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digit && i > 0) {
                      setOtpDigits((prev) => {
                        const next = [...prev];
                        next[i - 1] = "";
                        return next;
                      });
                      otpRefs.current[i - 1]?.focus();
                    }
                  }}
                  className="h-12 w-full max-w-[48px] text-center text-lg font-bold rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-ring/40 outline-none"
                />
              ))}
            </div>

            {/* Resend Code Link */}
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-muted-foreground">Didn't get the code?</span>
              <button
                type="button"
                disabled={resendSeconds > 0 || loading}
                onClick={handleSendOTP}
                className={`font-bold flex items-center gap-1 ${
                  resendSeconds > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-primary hover:underline"
                }`}
              >
                <RefreshCw className="h-3 w-3" />
                {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : "Resend Code"}
              </button>
            </div>
          </div>

          {/* NEW PASSWORD FIELD */}
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
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
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* CONFIRM PASSWORD FIELD */}
          <Input
            label="Confirm New Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            icon={<KeyRound className="h-4 w-4 text-muted-foreground" />}
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
            Reset Password & Sign In
          </Button>
        </form>
      )}
    </div>
  );
}
