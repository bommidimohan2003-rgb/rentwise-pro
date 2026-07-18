import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";
import { Info, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface PendingUser {
  email: string;
  phone: string;
  password?: string;
  fullName?: string;
}

export function OTPVerification() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const email = storage.get<string>(STORAGE_KEYS.otpEmail, "your email");

  const pendingUser = storage.get<PendingUser | null>(STORAGE_KEYS.pendingUser, null);
  const isResetFlow = !pendingUser;
  const targetContact = isResetFlow ? email : pendingUser?.phone || "your phone number";

  // Timer countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const change = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
    setError(null); // Clear error on change
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const code = digits.join("");
    if (code.length < 6) return setError("Enter all 6 digits");

    setError(null);
    setLoading(true);

    try {
      if (isResetFlow) {
        if (!newPassword) {
          setLoading(false);
          return setError("Enter a new password");
        }
        if (newPassword.length < 8) {
          setLoading(false);
          return setError("Password must be at least 8 characters");
        }
        if (newPassword !== confirmPassword) {
          setLoading(false);
          return setError("Passwords do not match");
        }

        await api.forgotPasswordReset(email, code, newPassword);
        storage.remove(STORAGE_KEYS.otp);
        storage.remove(STORAGE_KEYS.otpEmail);
        toast.success("Password reset successful! Please log in.");
      } else if (pendingUser) {
        await api.registerVerify(
          pendingUser.email,
          pendingUser.phone,
          code,
          pendingUser.password || "",
          pendingUser.fullName,
        );
        storage.remove(STORAGE_KEYS.otp);
        storage.remove(STORAGE_KEYS.pendingUser);
        storage.remove(STORAGE_KEYS.otpEmail);
        toast.success("Registration successful! Please log in.");
      }
      navigate({ to: "/login" });
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      if (isResetFlow) {
        await api.forgotPasswordRequest(email);
      } else if (pendingUser) {
        await api.registerRequest(pendingUser.email, pendingUser.phone);
      }
      setSeconds(60);
      setDigits(Array(6).fill(""));
      toast.success("New verification code sent!");
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to resend code");
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time SMS Verification */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm flex gap-3 items-start">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-primary">SMS Verification</span>
          <p className="text-muted-foreground mt-0.5 text-xs">
            We sent a verification code via SMS to{" "}
            <span className="font-semibold text-foreground">{targetContact}</span>.
          </p>
          <p className="text-muted-foreground text-xs mt-1.5 italic">
            Check your mobile device for the SMS verification code from Twilio.
          </p>
        </div>
      </div>

      {/* Demo Mode OTP Display */}
      {(() => {
        const generatedOtp = storage.get<string | null>(STORAGE_KEYS.otp, null);
        return generatedOtp ? (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl p-3.5 text-xs font-semibold text-center select-all">
            Demo Mode Verification Code: <span className="font-mono text-sm tracking-widest text-foreground bg-background px-2 py-0.5 rounded border border-border ml-1.5">{generatedOtp}</span>
          </div>
        ) : null;
      })()}

      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => change(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) {
                setDigits((prev) => {
                  const next = [...prev];
                  next[i - 1] = "";
                  return next;
                });
                refs.current[i - 1]?.focus();
              }
            }}
            className="h-14 w-full max-w-[52px] text-center text-xl font-semibold rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-ring/40 outline-none"
          />
        ))}
      </div>

      {isResetFlow && (
        <div className="space-y-4 pt-2 border-t border-border">
          <h3 className="font-semibold text-foreground text-sm">Set your new password</h3>
          <Input
            label="New Password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            label="Confirm New Password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button className="w-full" onClick={verify} loading={loading}>
        Verify Code
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        {seconds > 0 ? (
          <>
            Resend in <span className="font-medium">{seconds}s</span>
          </>
        ) : (
          <button onClick={resend} className="text-primary hover:underline font-medium">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
