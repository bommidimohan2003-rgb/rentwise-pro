import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { Info } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/types";

export function OTPVerification() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [otpCode, setOtpCode] = useState(storage.get<string>(STORAGE_KEYS.otp, ""));
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const email = storage.get<string>(STORAGE_KEYS.otpEmail, "your email");

  // Timer countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // Flash OTP in toast on mount so user sees it instantly
  useEffect(() => {
    const code = storage.get<string>(STORAGE_KEYS.otp, "");
    if (code) {
      toast.info(`[Demo Mode] Verification code: ${code}`, {
        duration: 10000,
        position: "top-center",
      });
    }
  }, []);

  const change = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = () => {
    const code = digits.join("");
    const stored = storage.get<string>(STORAGE_KEYS.otp, "");
    if (code.length < 6) return setError("Enter all 6 digits");
    if (code !== stored) return setError("Invalid code");

    storage.remove(STORAGE_KEYS.otp);

    // Complete registration if a pending user exists
    const pendingUser = storage.get<User>(STORAGE_KEYS.pendingUser, null);
    if (pendingUser) {
      const users = storage.get<User[]>(STORAGE_KEYS.users, []);
      storage.set(STORAGE_KEYS.users, [...users, pendingUser]);
      storage.remove(STORAGE_KEYS.pendingUser);
      toast.success("Account created successfully! Please log in.");
    } else {
      toast.success("Verification successful! Please log in.");
    }

    navigate({ to: "/login" });
  };

  const resend = () => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    storage.set(STORAGE_KEYS.otp, otp);
    setOtpCode(otp);
    console.info("[Payent] New OTP:", otp);

    setSeconds(60);
    setDigits(Array(6).fill(""));
    setError(null);

    toast.success("New verification code sent!");
    toast.info(`[Demo Mode] New verification code: ${otp}`, {
      duration: 10000,
      position: "top-center",
    });
  };

  const handleAutofill = () => {
    const code = storage.get<string>(STORAGE_KEYS.otp, "");
    if (code) {
      setDigits(code.split(""));
      setError(null);
      toast.success("Verification code auto-filled!");
    } else {
      toast.error("No active OTP code found. Please request a new one.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time frontend simulator box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm flex gap-3 items-start">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-primary">Demo Verification Simulator</span>
          <p className="text-muted-foreground mt-0.5 text-xs">
            We sent an email with the code to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <div className="bg-card px-2.5 py-1 rounded-md border border-border font-mono text-sm font-extrabold tracking-wider text-primary">
              {otpCode || "EXPIRED"}
            </div>
            <button
              type="button"
              onClick={handleAutofill}
              className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              Auto-fill OTP Code
            </button>
          </div>
        </div>
      </div>

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

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button className="w-full" onClick={verify}>
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
