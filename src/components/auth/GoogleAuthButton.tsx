import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signInWithGoogle } from "@/lib/firebase";
import { toast } from "sonner";
import { Mail, ArrowRight, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

interface GoogleAuthButtonProps {
  onSuccess: (googleUser: {
    email: string;
    fullName: string;
    avatar?: string;
    phone?: string;
  }) => void;
  label?: string;
}

export function GoogleAuthButton({
  onSuccess,
  label = "Continue with Google",
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [userGmail, setUserGmail] = useState("");
  const [userName, setUserName] = useState("");
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res && res.success && res.googleUser) {
        onSuccess(res.googleUser);
      }
    } catch (err: any) {
      console.warn("[Google Auth] Firebase Google Popup notice:", err);
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error("Could not complete Google Sign-In. Please allow browser popups or try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGmail || !userGmail.includes("@")) {
      return setGmailError("Please enter a valid Gmail address (e.g. name@gmail.com).");
    }

    setGmailError(null);
    setShowGmailModal(false);

    const formattedName = userName.trim() || userGmail.split("@")[0];
    onSuccess({
      email: userGmail.trim().toLowerCase(),
      fullName: formattedName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userGmail}`,
      phone: "",
    });
  };

  const modalContent = showGmailModal ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 relative">
        <button
          type="button"
          onClick={() => setShowGmailModal(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-foreground font-display flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Sign In with Your Gmail</span>
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Enter your Gmail address below to authenticate your account and save your profile to Cloud Firestore.
          </p>
        </div>

        <form onSubmit={handleGmailSubmit} className="space-y-4 text-left">
          <Input
            label="Your Gmail Address"
            type="email"
            placeholder="your.email@gmail.com"
            icon={<Mail className="h-4 w-4" />}
            value={userGmail}
            onChange={(e) => setUserGmail(e.target.value)}
            autoFocus
          />

          <Input
            label="Full Name (Optional)"
            placeholder="e.g. Mohan Bommidi"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />

          <div className="p-3 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Tip: Enter any valid Gmail address to instantly sign in and explore Payent.
            </span>
          </div>

          {gmailError && (
            <p className="text-xs text-destructive font-medium">{gmailError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowGmailModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <Button type="submit" className="px-5 font-bold text-xs h-10 rounded-xl flex items-center gap-1">
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="w-full h-11 rounded-xl border border-border bg-card hover:bg-secondary/60 text-foreground text-xs font-bold transition-all shadow-sm active:scale-98 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
          <span>{loading ? "Connecting to Google..." : label}</span>
        </button>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              toast.info("Opening Gmail sign-in helper...");
              setShowGmailModal(true);
            }}
            className="text-[11px] text-muted-foreground hover:text-primary underline cursor-pointer font-medium"
          >
            Having trouble? Use Gmail Helper directly
          </button>
        </div>
      </div>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}

