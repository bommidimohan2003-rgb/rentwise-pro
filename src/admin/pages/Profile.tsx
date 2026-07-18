import { useEffect, useState } from "react";
import { User, ShieldAlert, Key, UserCheck, Shield, UploadCloud } from "lucide-react";
import { notificationsService } from "../services/notifications";
import { authService } from "../services/auth";
import { AdminUser } from "../services/api";
import { Loader } from "../components/layout/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Profile() {
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form profile
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Form password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await authService.getMe();
      setProfile(data);
      setFullName(data.fullName);
      setEmail(data.email);
      setPhone(data.phone || "");
      setAvatar(data.avatar);
    } catch {
      toast.error("Failed to load user profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await notificationsService.updateProfile({ fullName, email, phone, avatar });
      // Dispatch profile updated event so topbar avatar dynamically syncs
      window.dispatchEvent(new Event("payent:admin:profile-updated"));
      toast.success("Profile details updated successfully.");
    } catch {
      toast.error("Failed to update profile details.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await notificationsService.updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch {
      toast.error("Failed to modify password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return <Loader message="Accessing admin profile credentials..." size="lg" />;
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Admin Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage personal credentials, update avatars, and override security passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Avatar display & specifications */}
        <div className="card-premium bg-card/60 p-6 flex flex-col items-center text-center">
          <img
            src={avatar}
            alt={fullName}
            className="h-28 w-28 rounded-full object-cover border-2 border-primary/20 shadow-lg"
          />
          <h2 className="text-base font-bold text-foreground mt-4">{fullName}</h2>
          <span className="text-xs text-muted-foreground font-medium">{email}</span>
          <span className="mt-3.5 inline-flex items-center text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
            {profile.role} account
          </span>

          <div className="w-full border-t border-border/40 mt-6 pt-5 text-left text-xs space-y-3 font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-bold text-foreground">{profile.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Verification status</span>
              <span className="font-bold text-green-500 flex items-center gap-0.5">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Verified</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Registered on</span>
              <span className="font-bold text-foreground">
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information */}
          <form onSubmit={handleUpdateProfile} className="card-premium bg-card/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/40 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-primary" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Avatar Image Link</label>
                <input
                  type="text"
                  required
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/40 shrink-0">
              <button
                type="submit"
                disabled={updatingProfile}
                className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 select-none"
              >
                {updatingProfile && <Loader message="" size="sm" />}
                <span>Save Profile Info</span>
              </button>
            </div>
          </form>

          {/* Change Password */}
          <form onSubmit={handleUpdatePassword} className="card-premium bg-card/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border/40 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-primary" />
              <span>Change Security Password</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/40 shrink-0">
              <button
                type="submit"
                disabled={updatingPassword}
                className="btn-gradient text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 select-none"
              >
                {updatingPassword && <Loader message="" size="sm" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
