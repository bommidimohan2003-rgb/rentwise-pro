import { useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Mail,
  Phone,
  User as UserIcon,
  MapPin,
  Briefcase,
  Globe,
  ShieldCheck,
  Star,
  CheckCircle2,
  CreditCard,
  Building,
  Clock,
  Award,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Profile() {
  const { user, ready, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    occupation: "",
    bio: "",
    city: "",
    pincode: "",
    website: "",
    upiId: "",
  });

  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/login" });
      return;
    }
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "+91 98765 43210",
        occupation: user.occupation || "Cinematographer & Drone Operator",
        bio:
          user.bio ||
          "Passionate filmmaker and aerial photographer. Renting out professional 4K cinema cameras, prime lenses, and workstation gear when off set.",
        city: user.city || "Bengaluru, KA",
        pincode: user.pincode || "560001",
        website: user.website || "https://creators.payent.in/arjun",
        upiId: user.upiId || "arjun@upi",
      });
    }
  }, [user, ready, navigate]);

  const saveProfile = () => {
    if (!user) return;
    updateUser(form);
    toast.success("Profile details updated successfully.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display">
            Account & Profile
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Manage your personal details, creator credentials, payout settings,
            and verification status.
          </p>
        </div>

        {/* Profile Card Header Banner */}
        <div className="card-premium overflow-hidden border border-border bg-card/60 relative">
          {/* Cover Art Banner */}
          <div className="h-32 sm:h-40 bg-gradient-to-r from-zinc-900 via-zinc-800 to-black relative p-6 flex items-end justify-between border-b border-border/40">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />
            <div className="relative z-10 hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Pro Creator Tier</span>
            </div>
          </div>

          {/* User Header Details */}
          <div className="p-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative">
                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-secondary border-4 border-card grid place-items-center text-foreground text-3xl font-extrabold shadow-xl overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.fullName?.charAt(0) ?? "U"}</span>
                  )}
                </div>
                <button
                  onClick={() =>
                    toast.info(
                      "Avatar upload trigger: Select an image file to update profile picture.",
                    )
                  }
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-xl bg-primary text-primary-foreground border border-border grid place-items-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
                  title="Change avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-display">
                    {user?.fullName || "Arjun Mehta"}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                    <ShieldCheck className="h-3 w-3" />
                    <span>ID Verified</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-foreground" />
                  <span>{form.occupation}</span>
                  <span>·</span>
                  <MapPin className="h-3.5 w-3.5 text-foreground" />
                  <span>{form.city}</span>
                </p>
                <p className="text-[11px] text-muted-foreground font-medium pt-0.5">
                  Member since October 2024 · Response time &lt; 1 hr
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="self-stretch sm:self-auto flex items-center gap-2">
              <Button
                onClick={saveProfile}
                size="sm"
                className="w-full sm:w-auto font-bold text-xs"
              >
                Save Profile Updates
              </Button>
            </div>
          </div>

          {/* Marketplace Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 mx-6 mb-6 rounded-2xl bg-secondary/40 border border-border/60 text-center">
            <div className="space-y-0.5">
              <div className="text-lg font-black text-foreground font-display">
                14
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                Completed Rentals
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-foreground font-display flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                <span>4.9</span>
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                Lender Rating (18)
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-foreground font-display flex items-center justify-center gap-1">
                <Award className="h-4 w-4 text-foreground" />
                <span>100%</span>
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                On-Time Return Rate
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-black text-foreground font-display flex items-center justify-center gap-1">
                <Clock className="h-4 w-4 text-foreground" />
                <span>&lt; 1 hr</span>
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                Avg Response Time
              </div>
            </div>
          </div>
        </div>

        {/* Content Section Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Profile Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Creator Information */}
            <div className="card-premium p-6 border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-foreground" />
                  <h3 className="font-bold text-base text-foreground">
                    General Creator Details
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Public Marketplace Info
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  icon={<UserIcon className="h-4 w-4" />}
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                />
                <Input
                  label="Role / Occupation"
                  icon={<Briefcase className="h-4 w-4" />}
                  value={form.occupation}
                  onChange={(e) =>
                    setForm({ ...form, occupation: e.target.value })
                  }
                />
              </div>

              {/* Bio Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                  Creator Bio / Inventory Notes
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell renters about your experience and gear handling standards..."
                  className="w-full bg-secondary/50 text-foreground text-xs rounded-xl p-3 border border-border focus:outline-none focus:border-primary transition-all font-medium resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Primary City"
                  icon={<Building className="h-4 w-4" />}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <Input
                  label="Pincode"
                  icon={<MapPin className="h-4 w-4" />}
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                />
              </div>

              <Input
                label="Portfolio / Showreel URL"
                icon={<Globe className="h-4 w-4" />}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={saveProfile}
                  size="sm"
                  className="font-bold text-xs"
                >
                  Save Details
                </Button>
              </div>
            </div>

            {/* Contact & Lender Payout Settings */}
            <div className="card-premium p-6 border border-border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-foreground" />
                  <h3 className="font-bold text-base text-foreground">
                    Contact & Payout Settings
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Financial & Delivery
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  icon={<Mail className="h-4 w-4" />}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  icon={<Phone className="h-4 w-4" />}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <Input
                label="Lender Payout UPI ID (For Earnings)"
                icon={<CreditCard className="h-4 w-4" />}
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              />

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={saveProfile}
                  size="sm"
                  className="font-bold text-xs"
                >
                  Update Payout Info
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Verification & Trust Badges */}
          <div className="space-y-6">
            {/* Verification Status Card */}
            <div className="card-premium p-5 border border-border space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                <ShieldCheck className="h-4 w-4 text-foreground" />
                <span>Verification & Trust Status</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Govt ID Verification
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Aadhaar / Passport verified
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Phone & Email Check
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        OTP SMS & Email confirmed
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Payent Rental Shield
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        ₹5,00,000 Equipment Coverage
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Preferred Handover & Pickup Info */}
            <div className="card-premium p-5 border border-border space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-3">
                <MapPin className="h-4 w-4 text-foreground" />
                <span>Handover Preferences</span>
              </h3>

              <div className="space-y-2 text-xs font-medium">
                <div className="flex justify-between text-muted-foreground">
                  <span>Handover Mode:</span>
                  <span className="font-bold text-foreground">
                    Self Pickup / Local Courier
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Pickup Operating Hours:</span>
                  <span className="font-bold text-foreground">
                    09:00 AM - 08:00 PM
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Deposit Security:</span>
                  <span className="font-bold text-foreground">
                    Zero-Hold Razorpay Authorization
                  </span>
                </div>
              </div>
            </div>

            {/* Support Callout */}
            <div className="card-premium p-5 border border-border bg-secondary/30 space-y-2 text-center">
              <h4 className="text-xs font-bold text-foreground">
                Need help updating account credentials?
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Contact Payent 24/7 Creator Support for GST billing updates or
                identity re-verification.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/contact" })}
                className="w-full font-bold text-xs mt-2"
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
