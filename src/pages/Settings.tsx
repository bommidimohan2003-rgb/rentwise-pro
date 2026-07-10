import { Bell, Globe, Lock, Trash2 } from "lucide-react";
import { useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-secondary"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [emails, setEmails] = useState(true);
  const [push, setPush] = useState(false);

  return (
    <DashboardLayout>
      <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
      <div className="mt-8 space-y-6 max-w-3xl">
        <div className="card-premium p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Globe className="h-5 w-5" /> Appearance</h3>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">Switch between light and dark theme.</div>
            </div>
            <Toggle on={theme === "dark"} onChange={toggle} />
          </div>
        </div>
        <div className="card-premium p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <Toggle on={emails} onChange={() => setEmails((v) => !v)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Push notifications</span>
              <Toggle on={push} onChange={() => setPush((v) => !v)} />
            </div>
          </div>
        </div>
        <div className="card-premium p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Lock className="h-5 w-5" /> Security</h3>
          <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/profile" })}>Change password</Button>
        </div>
        <div className="card-premium p-6 border-destructive/40">
          <h3 className="font-semibold text-lg text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Danger zone</h3>
          <p className="text-sm text-muted-foreground mt-2">Log out of this session.</p>
          <Button variant="destructive" className="mt-4" onClick={() => { logout(); navigate({ to: "/" }); }}>
            Logout
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
