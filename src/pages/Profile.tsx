import { useNavigate } from "@tanstack/react-router";
import { Camera, Mail, Phone, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user, ready, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
    if (user) setForm({ fullName: user.fullName, email: user.email, phone: user.phone });
  }, [user, ready, navigate]);

  const save = () => user && updateUser(form);

  const changePw = () => {
    if (!user) return;
    if (pw.current !== user.password) return setPwMsg("Current password is incorrect");
    if (pw.next.length < 8) return setPwMsg("Password must be 8+ chars");
    if (pw.next !== pw.confirm) return setPwMsg("Passwords don't match");
    updateUser({ password: pw.next });
    setPwMsg("Password updated ✓");
    setPw({ current: "", next: "", confirm: "" });
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl md:text-4xl font-bold">Profile</h1>
      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="card-premium p-6 text-center">
          <div className="relative inline-block">
            <div className="h-28 w-28 rounded-full btn-gradient grid place-items-center text-white text-3xl font-bold mx-auto">
              {user?.fullName?.charAt(0) ?? "U"}
            </div>
            <button className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-card border border-border grid place-items-center">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-4 font-semibold text-lg">{user?.fullName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div><div className="font-bold">12</div><div className="text-xs text-muted-foreground">Rentals</div></div>
            <div><div className="font-bold">4.9</div><div className="text-xs text-muted-foreground">Rating</div></div>
            <div><div className="font-bold">3</div><div className="text-xs text-muted-foreground">Listings</div></div>
          </div>
        </div>

        <div className="card-premium p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg">Edit profile</h3>
          <Input label="Full name" icon={<UserIcon className="h-4 w-4" />} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Email" icon={<Mail className="h-4 w-4" />} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" icon={<Phone className="h-4 w-4" />} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Button onClick={save}>Save changes</Button>
        </div>

        <div className="card-premium p-6 lg:col-span-3 space-y-4">
          <h3 className="font-semibold text-lg">Change password</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Current" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            <Input label="New" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            <Input label="Confirm" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          {pwMsg && <p className={`text-sm ${pwMsg.includes("✓") ? "text-emerald-600" : "text-destructive"}`}>{pwMsg}</p>}
          <Button onClick={changePw}>Update password</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
