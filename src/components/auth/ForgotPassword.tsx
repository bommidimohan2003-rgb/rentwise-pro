import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { toast } from "sonner";
import { api } from "@/utils/api";

export function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
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
      await api.forgotPasswordReset(cleanEmail, "DIRECT", newPassword);
      toast.success("Password changed successfully! Please sign in with your new password.");
      navigate({ to: "/login" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to update password. Please check your email.");
      toast.error(msg || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

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
        Update Password & Sign In
      </Button>
    </form>
  );
}
