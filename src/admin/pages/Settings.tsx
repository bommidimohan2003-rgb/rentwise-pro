import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Globe,
  Palette,
  Megaphone,
  Share2,
  Save,
  Loader2,
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
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "branding" | "seo" | "social">("general");

  const { theme, toggle } = useTheme();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getSettings();
      setSettings(data);
    } catch {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSubmitting(true);
    try {
      // Sync theme hook if user changed theme in dropdown
      const updated = await notificationsService.updateSettings(settings);
      setSettings(updated);

      toast.success("Settings saved successfully.");
    } catch {
      toast.error("Failed to save settings.");
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

  if (loading) {
    return <Loader message="Accessing config parameters..." size="lg" />;
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure Payent parameters, change branding details, set SEO tags, and sync color themes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar Panel */}
        <div className="card-premium bg-card/60 p-2 space-y-1">
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
              activeTab === "general"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Globe className="h-4 w-4" />
            <span>General Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("branding")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
              activeTab === "branding"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Palette className="h-4 w-4" />
            <span>Appearance & Theme</span>
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
              activeTab === "seo"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Megaphone className="h-4 w-4" />
            <span>SEO Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left",
              activeTab === "social"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-secondary",
            )}
          >
            <Share2 className="h-4 w-4" />
            <span>Social Connections</span>
          </button>
        </div>

        {/* Configurations Fields Area */}
        <form onSubmit={handleSave} className="md:col-span-3 card-premium bg-card/60 p-6 space-y-5">
          {activeTab === "general" && (
            <div className="space-y-4 text-xs font-semibold">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b">General Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Website Branding Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.websiteName}
                    onChange={(e) => handleFieldChange("websiteName", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Primary Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settings.contactEmail}
                    onChange={(e) => handleFieldChange("contactEmail", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Hotline Support Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.contactPhone}
                    onChange={(e) => handleFieldChange("contactPhone", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Homepage Header Promo Text
                  </label>
                  <input
                    type="text"
                    value={settings.homepageBannerText}
                    onChange={(e) => handleFieldChange("homepageBannerText", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Footer Copyrights Text
                  </label>
                  <input
                    type="text"
                    value={settings.footerText}
                    onChange={(e) => handleFieldChange("footerText", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-4 text-xs font-semibold">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b">Theme & Logo</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Asset Logo URL</label>
                  <input
                    type="text"
                    required
                    value={settings.logoUrl}
                    onChange={(e) => handleFieldChange("logoUrl", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div className="p-4 rounded-xl bg-secondary/20 border flex items-center justify-between">
                  <div className="flex flex-col pr-4">
                    <span className="text-xs font-bold text-foreground">
                      Synchronized color modes
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Toggle admin interface theme colors
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggle}
                    className="btn-gradient text-xs px-4.5 py-2.5 rounded-xl font-bold uppercase tracking-wider select-none"
                  >
                    Set {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="space-y-4 text-xs font-semibold">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b">
                Search Engine Optimizations
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Default SEO Meta Title
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.seoTitle}
                    onChange={(e) => handleFieldChange("seoTitle", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Default SEO Meta Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={settings.seoDescription}
                    onChange={(e) => handleFieldChange("seoDescription", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-4 text-xs font-semibold">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b">
                Social Networking Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Facebook Link</label>
                  <input
                    type="text"
                    value={settings.socialFacebook}
                    onChange={(e) => handleFieldChange("socialFacebook", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    Twitter / X Link
                  </label>
                  <input
                    type="text"
                    value={settings.socialTwitter}
                    onChange={(e) => handleFieldChange("socialTwitter", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">Instagram Link</label>
                  <input
                    type="text"
                    value={settings.socialInstagram}
                    onChange={(e) => handleFieldChange("socialInstagram", e.target.value)}
                    className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border/40 shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="btn-gradient text-xs px-5 py-3.5 rounded-xl font-bold flex items-center gap-2 select-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4.5 w-4.5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
