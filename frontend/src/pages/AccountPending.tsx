import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  User,
  MessageSquare,
  AlertCircle,
  Camera,
  Plane,
  Laptop,
  Mic2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PayentLogoMark, LogoIcon } from "@/components/common/LogoIcon";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AccountPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    user?.status === "approved" || user?.status === "active"
      ? "approved"
      : user?.status === "rejected"
        ? "rejected"
        : "pending",
  );
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkStatus = useCallback(async (isManual = false) => {
    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) return;

    if (isManual) setChecking(true);
    try {
      const res = await api.getAuthStatus(token);
      setLastChecked(new Date());

      if (res && res.status) {
        const rawStatus = res.status.toLowerCase();
        if (rawStatus === "approved" || rawStatus === "active" || res.is_approved) {
          setStatus("approved");
          // Update cached user in storage
          const cachedUser = storage.get<Record<string, unknown> | null>(
            STORAGE_KEYS.currentUser,
            null,
          );
          if (cachedUser) {
            cachedUser.status = "approved";
            cachedUser.verified = true;
            storage.set(STORAGE_KEYS.currentUser, cachedUser);
            window.dispatchEvent(new CustomEvent("payent:storage_change"));
          }
          toast.success("Account Approved! Welcome to Payent.");
          setTimeout(() => {
            navigate({ to: "/dashboard" });
          }, 1500);
        } else if (rawStatus === "rejected") {
          setStatus("rejected");
        } else {
          setStatus("pending");
          if (isManual) {
            toast.info("Account is currently under administrative review.");
          }
        }
      }
    } catch (err) {
      console.warn("Status check notice:", err);
    } finally {
      if (isManual) setChecking(false);
    }
  }, [navigate]);

  // If already approved on initial render, navigate immediately
  useEffect(() => {
    if (user?.status === "approved" || user?.status === "active" || user?.role === "admin") {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  // Periodic Auto-Polling (Every 12 seconds)
  useEffect(() => {
    // Initial check
    checkStatus(false);

    const interval = setInterval(() => {
      checkStatus(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 group">
          <LogoIcon showTagline={true} />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
          >
            <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
            <span>Support</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="text-xs text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-red-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Review Status Card */}
      <main className="relative z-10 w-full max-w-xl mx-auto my-auto py-8 text-center flex flex-col items-center">
        {/* Animated Waiting Stage */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-6">
          {/* Orbiting Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-emerald-500/25"
          >
            {/* Orbiting Creator Gear Icons */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 p-2 rounded-full bg-neutral-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div className="absolute top-1/2 -right-3 -translate-y-1/2 p-2 rounded-full bg-neutral-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Plane className="w-3.5 h-3.5" />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-2 rounded-full bg-neutral-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Laptop className="w-3.5 h-3.5" />
            </div>
            <div className="absolute top-1/2 -left-3 -translate-y-1/2 p-2 rounded-full bg-neutral-900 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Mic2 className="w-3.5 h-3.5" />
            </div>
          </motion.div>

          {/* Soft Pulsing Inner Ring */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-4 rounded-full bg-emerald-500/10 border border-emerald-500/30"
          />

          {/* Center Logo Mark */}
          <div className="relative z-10 flex items-center justify-center drop-shadow-[0_0_35px_rgba(16,185,129,0.65)]">
            <PayentLogoMark className="h-16 w-16 sm:h-20 sm:w-20" />
          </div>
        </div>

        {/* Status Badge */}
        {status === "approved" ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>APPROVED</span>
          </div>
        ) : status === "rejected" ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>REJECTED</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>PENDING APPROVAL</span>
          </div>
        )}

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-3">
          {status === "approved"
            ? "Your account is approved!"
            : status === "rejected"
              ? "Your account could not be approved."
              : "Your account is being reviewed."}
        </h1>

        {/* Supporting Copy */}
        <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed mb-8">
          {status === "approved"
            ? "Welcome to PAYENT. Entering your creator workspace..."
            : status === "rejected"
              ? "We were unable to approve your account at this time. Please contact PAYENT Support for further assistance."
              : "Thanks for joining PAYENT. Your account details are being reviewed by our team."}
        </p>

        {/* Progress Step Strip */}
        <div className="w-full bg-neutral-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 text-left shadow-lg">
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Identity Details Submitted</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">Complete</span>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex items-center gap-2.5",
                  status === "approved"
                    ? "text-emerald-400"
                    : status === "rejected"
                      ? "text-red-400"
                      : "text-amber-400",
                )}
              >
                {status === "approved" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                <span className="font-semibold">Admin Verification</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {status === "approved"
                  ? "Approved"
                  : status === "rejected"
                    ? "Declined"
                    : "In Progress"}
              </span>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "flex items-center gap-2.5",
                  status === "approved" ? "text-emerald-400" : "text-neutral-500",
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold">Marketplace Access</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                {status === "approved" ? "Unlocked" : "Locked"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => checkStatus(true)}
            disabled={checking}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-neutral-950 font-bold text-xs hover:bg-neutral-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", checking && "animate-spin")} />
            <span>{checking ? "Checking..." : "Refresh Status"}</span>
          </button>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-transparent text-neutral-300 font-semibold text-xs hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </Link>
        </div>

        {/* Auto-check notice */}
        <p className="mt-5 text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Status auto-refreshes periodically • Last checked {lastChecked.toLocaleTimeString()}</span>
        </p>
      </main>

      {/* Bottom Footer Note */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto pt-6 border-t border-white/10 text-center">
        <p className="text-xs text-neutral-500">
          PAYENT Security Guard • Verified peer-to-peer equipment rentals
        </p>
      </footer>
    </div>
  );
}
