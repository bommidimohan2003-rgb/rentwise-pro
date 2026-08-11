import { useState } from "react";
import { signInWithGooglePopup } from "@/lib/firebase";
import { api } from "@/utils/api";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { CompleteProfileModal } from "./CompleteProfileModal";
import { toast } from "sonner";

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  isAdminRoute?: boolean;
}

export function GoogleAuthButton({ onSuccess, isAdminRoute = false }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    email: string;
    fullName?: string;
    idToken?: string;
  } | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const authResult = await signInWithGooglePopup();
      if (!authResult) {
        setLoading(false);
        return;
      }

      const { email, displayName, idToken } = authResult;
      if (!email) {
        throw new Error("No email associated with this Google account.");
      }

      // First attempt googleSync without mandatory address/phone to check existing user
      try {
        const syncRes = await api.googleSync({
          email,
          fullName: displayName || undefined,
          idToken,
        });

        if (syncRes.success && syncRes.token) {
          storage.set(STORAGE_KEYS.token, syncRes.token);
          storage.set(STORAGE_KEYS.currentUser, syncRes.user);

          if (isAdminRoute && syncRes.user?.role === "admin") {
            localStorage.setItem("payent:admin:token", syncRes.token);
            localStorage.setItem("payent:admin:current_user", JSON.stringify(syncRes.user));
          }

          toast.success(`Welcome ${syncRes.user.fullName || syncRes.user.email}!`);
          onSuccess?.();
          return;
        }
      } catch (err: any) {
        // If profile details (phone/address) are required or user needs setup, open modal
        console.warn("[Google Auth] Initial sync prompt modal:", err?.message);
      }

      setPendingGoogleUser({
        email,
        fullName: displayName || undefined,
        idToken,
      });
      setShowModal(true);
    } catch (err: any) {
      console.error("[Google Auth] Error:", err);
      toast.error(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (data: {
    phone: string;
    address: string;
    city: string;
    pincode: string;
    adminCode?: string;
  }) => {
    if (!pendingGoogleUser) return;

    const syncRes = await api.googleSync({
      email: pendingGoogleUser.email,
      fullName: pendingGoogleUser.fullName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      adminCode: data.adminCode,
      idToken: pendingGoogleUser.idToken,
    });

    if (syncRes.success && syncRes.token) {
      storage.set(STORAGE_KEYS.token, syncRes.token);
      storage.set(STORAGE_KEYS.currentUser, syncRes.user);

      if (syncRes.user?.role === "admin") {
        localStorage.setItem("payent:admin:token", syncRes.token);
        localStorage.setItem("payent:admin:current_user", JSON.stringify(syncRes.user));
      }

      toast.success("Account setup complete!");
      onSuccess?.();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-secondary text-foreground hover:bg-secondary/80 border border-border rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loading ? "Connecting to Google..." : "Continue with Google"}</span>
      </button>

      {pendingGoogleUser && (
        <CompleteProfileModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
          email={pendingGoogleUser.email}
          fullName={pendingGoogleUser.fullName}
          isAdminRoute={isAdminRoute}
        />
      )}
    </>
  );
}
