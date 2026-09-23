import { useEffect, useState, useCallback } from "react";
import {
  Settings as SettingsIcon,
  Globe,
  Palette,
  Megaphone,
  Share2,
  Save,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { notificationsService } from "../services/notifications";
import { AdminSettings } from "../services/api";
import { useTheme } from "@/hooks/useTheme";
import { Loader } from "../components/layout/Loader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "branding" | "seo" | "appearance">("general");

  const { theme, toggle } = useTheme();

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await notificationsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load platform settings from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSubmitting(true);
      const updated = await notificationsService.updateSettings(settings);
      setSettings(updated);
      toast.success("Platform settings persisted successfully.");
    } catch {
      toast.error("Failed to save settings to database.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof AdminSettings, value: string) => {
    setSettings((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  if (loading && !settings) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader message="Loading platform configuration..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
            Platform Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Persisted configurations, branding assets, SEO metadata, and system appearance.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-secondary border border-border/80 text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Sync Settings</span>
        </button>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSettings} className="underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {settings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* TAB NAVIGATION PANEL */}
          <div className="p-2 bg-card rounded-2xl border border-border/80 shadow-xs space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                activeTab === "general"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Globe className="h-4 w-4" />
              <span>General Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("branding")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                activeTab === "branding"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Megaphone className="h-4 w-4" />
              <span>Branding & Banners</span>
            </button>

            <button
              onClick={() => setActiveTab("seo")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                activeTab === "seo"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Share2 className="h-4 w-4" />
              <span>SEO & Metadata</span>
            </button>

            <button
              onClick={() => setActiveTab("appearance")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer",
                activeTab === "appearance"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Palette className="h-4 w-4" />
              <span>System Appearance</span>
            </button>
          </div>

          {/* MAIN SETTINGS FORM */}
          <div className="md:col-span-3 p-6 bg-card rounded-2xl border border-border/80 shadow-xs">
            <form onSubmit={handleSave} className="space-y-5 text-xs">
              {activeTab === "general" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">General Marketplace Parameters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">Website Platform Name</label>
                      <input
                        type="text"
                        value={settings.websiteName}
                        onChange={(e) => handleFieldChange("websiteName", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-foreground">Contact Email</label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => handleFieldChange("contactEmail", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Support Hotline Phone</label>
                    <input
                      type="text"
                      value={settings.contactPhone}
                      onChange={(e) => handleFieldChange("contactPhone", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {activeTab === "branding" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Branding Assets & Announcement Banners</h3>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Navbar Logo Asset URL</label>
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) => handleFieldChange("logoUrl", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Homepage Hero Headline / Banner</label>
                    <input
                      type="text"
                      value={settings.homepageBannerText}
                      onChange={(e) => handleFieldChange("homepageBannerText", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Footer Copyright Notice</label>
                    <input
                      type="text"
                      value={settings.footerText}
                      onChange={(e) => handleFieldChange("footerText", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Search Engine Optimization Tags</h3>
                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Meta Title</label>
                    <input
                      type="text"
                      value={settings.seoTitle}
                      onChange={(e) => handleFieldChange("seoTitle", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-foreground">Meta Description</label>
                    <textarea
                      rows={3}
                      value={settings.seoDescription}
                      onChange={(e) => handleFieldChange("seoDescription", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border/80 text-foreground font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground">System Appearance Mode</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={toggle}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all",
                        theme === "light" ? "border-primary bg-primary/5 font-bold" : "border-border/60 bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <Sun className="h-5 w-5 text-amber-500" />
                      <span>Light Theme</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggle}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all",
                        theme === "dark" ? "border-primary bg-primary/5 font-bold" : "border-border/60 bg-secondary/40 text-muted-foreground"
                      )}
                    >
                      <Moon className="h-5 w-5 text-foreground" />
                      <span>Dark Theme</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border/40">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{submitting ? "Saving to Database..." : "Save Settings"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
