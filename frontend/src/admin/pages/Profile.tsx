import { useEffect, useState, useCallback } from "react";
import {
  User,
  Shield,
  Key,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  LogOut,
  Calendar,
} from "lucide-react";
import { notificationsService } from "../services/notifications";
import { authService } from "../services/auth";
import { AdminUser } from "../services/api";
import { Loader } from "../components/layout/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

export default function Profile() {
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getMe();
      setProfile(data);
      setFullName(data.fullName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load authenticated administrator credentials.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await notificationsService.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      window.dispatchEvent(new Event("payent:admin:profile-updated"));
      toast.success("Profile credentials updated.");
    } catch {
      toast.error("Failed to update profile details.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await notificationsService.updatePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to update password.";
      toast.error(msg);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate({ to: "/login" });
  };

  if (loading && !profile) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader message="Loading administrator profile..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
            Administrator Profile & Security
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authenticated administrator credentials, role capabilities, and password security.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-all cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProfile} className="underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* PROFILE SUMMARY CARD */}
          <div className="p-6 bg-card rounded-2xl border border-border/80 shadow-xs space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary border-2 border-border/80 flex items-center justify-center font-bold text-xl text-foreground overflow-hidden shrink-0">
                {profile.avatar || profile.profilePhotoUrl ? (
                  <img src={profile.avatar || profile.profilePhotoUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span>{(profile.fullName || profile.email).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{profile.fullName || "Administrator"}</h3>
                <p className="text-xs text-muted-foreground font-mono">{profile.email}</p>
                <span className="mt-1.5 inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-primary text-primary-foreground">
                  {profile.role || "admin"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Admin ID</span>
                <span className="font-mono font-bold">{profile.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Security State</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Active Session
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Registered</span>
                <span className="font-mono">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </div>

          {/* EDIT CREDENTIALS & PASSWORD */}
          <div className="lg:col-span-2 space-y-6">
            {/* PROFILE DETAILS FORM */}
            <div className="p-6 bg-card rounded-2xl border border-border/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Identity & Contact Details</span>
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {updatingProfile ? "Saving..." : "Save Identity Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* PASSWORD FORM */}
            <div className="p-6 bg-card rounded-2xl border border-border/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <span>Security & Password Key Rotation</span>
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {updatingPassword ? "Rotating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
