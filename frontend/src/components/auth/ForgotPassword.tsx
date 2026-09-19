import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { toast } from "sonner";
import { api } from "@/utils/api";

export function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query search params (?token=XYZ)
  const queryParams = new URLSearchParams(location.search);
  const rawUrlToken = queryParams.get("token")?.trim() || "";

  // Component state
  const [token, setToken] = useState<string>(rawUrlToken);
  const [email, setEmail] = useState("");
  const [isRequested, setIsRequested] = useState(false);

  // Token validation state
  const [isValidatingToken, setIsValidatingToken] = useState<boolean>(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState<string>("");
  const [maskedEmail, setMaskedEmail] = useState<string>("");

  // New password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & discrete error states (Step 15 requirement)
  const [submitting, setSubmitting] = useState(false);
  const [resetRequestError, setResetRequestError] = useState<string | null>(null);
  const [resetTokenError, setResetTokenError] = useState<string | null>(null);
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sync token from URL search parameter when location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token")?.trim() || "";
    setToken(urlToken);
  }, [location.search]);

  // Validate token with backend if token exists
  useEffect(() => {
    if (!token) {
      setIsTokenValid(null);
      setIsValidatingToken(false);
      setResetTokenError(null);
      return;
    }

    let isMounted = true;
    setIsValidatingToken(true);
    setResetTokenError(null);

    api.validateResetToken(token)
      .then((res) => {
        if (!isMounted) return;
        if (res?.valid) {
          setIsTokenValid(true);
          setTokenEmail(res.email || "");
          setMaskedEmail(res.masked_email || res.email || "");
          setResetTokenError(null);
        } else {
          setIsTokenValid(false);
          setResetTokenError(
            "Your password reset link is invalid or expired. Please request a new reset link."
          );
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setIsTokenValid(false);
        const msg = err instanceof Error ? err.message : String(err);
        setResetTokenError(
          msg ||
            "Your password reset link is invalid or expired. Please request a new reset link."
        );
      })
      .finally(() => {
        if (isMounted) setIsValidatingToken(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle Step 4: Request Password Reset Link (No OTP)
  const handleRequestResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setResetRequestError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setResetRequestError(null);

    try {
      const res = await api.forgotPasswordRequest(cleanEmail);
      setIsRequested(true);
      toast.success(
        res?.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResetRequestError(
        msg || "Failed to send reset link. Please try again later."
      );
      toast.error(msg || "Failed to send reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Step 8: Update Password with Secure Token (No OTP)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordValidationError(null);

    if (!token) {
      setResetTokenError(
        "Your password reset link is invalid or expired. Please request a new reset link."
      );
      return;
    }

    if (!newPassword) {
      setPasswordValidationError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordValidationError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordValidationError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await api.forgotPasswordReset(token, newPassword, tokenEmail || email);
      setResetSuccess(true);
      toast.success("Password updated successfully! Please sign in with your new password.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("token")
      ) {
        setResetTokenError(
          "Your password reset link is invalid or expired. Please request a new reset link."
        );
      } else {
        setPasswordValidationError(msg || "Failed to update password.");
      }
      toast.error(msg || "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: Token in URL -> Reset Password Screen (Step 6 / 7 / 8)
  // -------------------------------------------------------------
  if (token) {
    // 1A. Validating Token Loading State
    if (isValidatingToken) {
      return (
        <div className="py-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary animate-spin">
            <RotateCcw className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Verifying secure reset link...
          </p>
          <p className="text-xs text-muted-foreground">
            Please wait while we validate your one-time security token.
          </p>
        </div>
      );
    }

    // 1B. Invalid or Expired Token State (Step 7 & 12)
    if (isTokenValid === false || resetTokenError) {
      return (
        <div className="space-y-5 py-2">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-destructive">
                Link Invalid or Expired
              </h4>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {resetTokenError ||
                  "Your password reset link is invalid or expired. Please request a new reset link."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              setToken("");
              setIsTokenValid(null);
              setResetTokenError(null);
              navigate({ to: "/forgot-password", search: { token: "" } });
            }}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Request a New Reset Link
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      );
    }

    // 1C. Successful Password Reset Confirmation
    if (resetSuccess) {
      return (
        <div className="space-y-5 py-4 text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-foreground">
              Password Updated Successfully
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your password has been changed. All existing sessions have been signed out for security.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md cursor-pointer"
          >
            Proceed to Sign In
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      );
    }

    // 1D. Active "Create a New Password" Form (Step 6)
    return (
      <form onSubmit={handleUpdatePassword} className="space-y-5">
        {/* Token Account Context Badge */}
        {(maskedEmail || tokenEmail) && (
          <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/50 rounded-xl text-xs">
            <div className="flex items-center space-x-2 truncate">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground truncate">
                Account: {maskedEmail || tokenEmail}
              </span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full shrink-0">
              Verified Token
            </span>
          </div>
        )}

        {/* New Password Field (Masked by default with accessible toggle) */}
        <div className="space-y-1.5">
          <div className="relative">
            <Input
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordValidationError(null);
              }}
              icon={<Lock className="h-4 w-4 text-muted-foreground" />}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm New Password Field (Masked by default with accessible toggle) */}
        <div className="space-y-1.5">
          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordValidationError(null);
              }}
              icon={<Lock className="h-4 w-4 text-muted-foreground" />}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password Strength Requirements Helper */}
        <div className="p-3 bg-secondary/40 border border-border/50 rounded-xl space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Password Requirements</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li className={newPassword.length >= 8 ? "text-emerald-500 font-semibold" : ""}>
              Minimum 8 characters in length
            </li>
            <li className={newPassword && newPassword === confirmPassword ? "text-emerald-500 font-semibold" : ""}>
              New password and confirm password must match
            </li>
          </ul>
        </div>

        {/* Password Validation Error Banner */}
        {passwordValidationError && (
          <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{passwordValidationError}</span>
          </div>
        )}

        {/* Submit Button (Step 6 requirement: "Update Password & Sign In") */}
        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md cursor-pointer"
          loading={submitting}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Update Password & Sign In
        </Button>
      </form>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: Request Reset Link Screen (Step 4)
  // -------------------------------------------------------------
  if (isRequested) {
    return (
      <div className="space-y-5 py-2">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Reset Link Dispatched
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an account exists for <strong className="text-foreground">{email}</strong>, a secure password reset link has been sent.
            </p>
            <p className="text-[11px] text-muted-foreground/80 italic pt-1">
              The link expires in 15 minutes. Check your inbox and spam folders.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            setIsRequested(false);
            setEmail("");
            setResetRequestError(null);
          }}
          variant="outline"
          className="w-full font-bold py-3 rounded-xl cursor-pointer"
        >
          Send to a Different Email
        </Button>

        <div className="text-center pt-1">
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-foreground font-semibold inline-flex items-center gap-1"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleRequestResetLink} className="space-y-5">
      <Input
        label="Account Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setResetRequestError(null);
        }}
        icon={<Mail className="h-4 w-4 text-muted-foreground" />}
        autoComplete="email"
        required
      />

      {resetRequestError && (
        <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{resetRequestError}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md cursor-pointer"
        loading={submitting}
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        Send Reset Link
      </Button>

      <div className="p-3 bg-secondary/40 border border-border/40 rounded-xl flex items-center gap-2 text-[11px] text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span>We will email you a secure, single-use link to reset your password.</span>
      </div>
    </form>
  );
}
