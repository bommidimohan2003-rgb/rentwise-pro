import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Phone, MapPin, Building2, Compass, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { saveUserToFirebase } from "@/lib/firebase";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { toast } from "sonner";
import type { User } from "@/types";

interface CompleteProfileModalProps {
  googleUser: {
    email: string;
    fullName: string;
    avatar?: string;
    phone?: string;
  };
  isAdminRoute?: boolean;
  onComplete: (user: User) => void;
  onCancel: () => void;
}

export function CompleteProfileModal({
  googleUser,
  isAdminRoute,
  onComplete,
  onCancel,
}: CompleteProfileModalProps) {
  const [phone, setPhone] = useState(googleUser.phone || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showAdminOption = useMemo(() => {
    if (typeof isAdminRoute === "boolean") return isAdminRoute;
    if (typeof window === "undefined") return false;
    const href = window.location.href.toLowerCase();
    return href.includes("admin");
  }, [isAdminRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 7) {
      return setError("Please enter a valid phone number.");
    }
    if (!address || address.trim().length < 5) {
      return setError("Please enter your complete street address.");
    }
    if (!city || city.trim().length < 2) {
      return setError("Please enter your city.");
    }
    if (!pincode || pincode.trim().length < 6) {
      return setError("Please enter a valid 6-digit PIN code.");
    }

    setError(null);
    setLoading(true);

    try {
      const isAdminRegistration =
        showAdminOption && adminCode.trim().length > 0;

      const fullUser: User = {
        id: googleUser.email,
        fullName: googleUser.fullName,
        email: googleUser.email,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        avatar: googleUser.avatar,
        role: isAdminRegistration ? "admin" : "user",
      };

      // Save complete user profile document to Firebase Firestore database
      await saveUserToFirebase(fullUser);

      // Save user session to storage
      storage.set(STORAGE_KEYS.currentUser, fullUser);
      storage.set(STORAGE_KEYS.token, `google-firebase-jwt-${Date.now()}`);

      toast.success(
        isAdminRegistration
          ? "Admin profile created successfully!"
          : "Profile details saved successfully to Firebase!"
      );
      onComplete(fullUser);
    } catch (err: any) {
      console.error("[Firebase] Error saving Google user details:", err);
      setError(err?.message || "Failed to save profile details.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative overflow-hidden">
        {/* Header Banner */}
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center text-primary shrink-0">
            {googleUser.avatar ? (
              <img
                src={googleUser.avatar}
                alt={googleUser.fullName}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground font-display">
              Complete Your Account Details
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Signed in as <span className="font-bold text-foreground">{googleUser.email}</span>. Add your contact & delivery info to finish registration.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            label="Phone Number (Required for SMS Alerts)"
            placeholder="+91 98765 43210"
            icon={<Phone className="h-4 w-4" />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Street Address / House No"
            placeholder="123 Indiranagar, 100ft Road"
            icon={<MapPin className="h-4 w-4" />}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Bengaluru"
              icon={<Building2 className="h-4 w-4" />}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <Input
              label="PIN Code"
              placeholder="560038"
              icon={<Compass className="h-4 w-4" />}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>

          {/* Admin Security Code (Only rendered on /admin/register or ?admin=true) */}
          {showAdminOption && (
            <div className="space-y-1.5 p-3 rounded-xl bg-secondary/80 border border-primary/20">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-wider mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Security Code (Optional)</span>
              </div>
              <Input
                label="Admin Code"
                placeholder="PAYENT-ADMIN-2026 (Enter code to register as Admin)"
                icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              className="px-6 font-extrabold text-xs h-11 rounded-xl flex items-center gap-1.5 cursor-pointer"
              loading={loading}
            >
              <span>Save & Continue</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return mounted ? createPortal(modalContent, document.body) : null;
}
