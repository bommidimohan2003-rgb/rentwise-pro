import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/common/Button";
import { STORAGE_KEYS, storage } from "@/utils/storage";

export function OTPVerification() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

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
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = () => {
    const code = digits.join("");
    const stored = storage.get<string>(STORAGE_KEYS.otp, "");
    if (code.length < 6) return setError("Enter all 6 digits");
    if (code !== stored) return setError("Invalid code");
    storage.remove(STORAGE_KEYS.otp);
    navigate({ to: "/login" });
  };

  const resend = () => {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    storage.set(STORAGE_KEYS.otp, otp);
    // eslint-disable-next-line no-console
    console.info("[TechRent] New OTP:", otp);
    setSeconds(60);
    setDigits(Array(6).fill(""));
  };

  return (
    <div className="space-y-6">
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
              if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            className="h-14 w-full max-w-[52px] text-center text-xl font-semibold rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-ring/40 outline-none"
          />
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={verify}>
        Verify
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        {seconds > 0 ? (
          <>Resend in <span className="font-medium">{seconds}s</span></>
        ) : (
          <button onClick={resend} className="text-primary hover:underline font-medium">
            Resend code
          </button>
        )}
      </div>
    </div>
  );
}
