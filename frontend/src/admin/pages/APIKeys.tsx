import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Search,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Trash2,
  Edit2,
  Eye,
  Shield,
  Clock,
  Activity,
  Zap,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiKeysService, AdminAPIKey } from "../services/apiKeys";

const AVAILABLE_SCOPES = [
  { id: "users:read", label: "Users Read", group: "Users" },
  { id: "users:write", label: "Users Write", group: "Users" },
  { id: "products:read", label: "Products Read", group: "Products" },
  { id: "products:write", label: "Products Write", group: "Products" },
  { id: "bookings:read", label: "Bookings Read", group: "Bookings" },
  { id: "bookings:write", label: "Bookings Write", group: "Bookings" },
  { id: "payments:read", label: "Payments Read", group: "Payments" },
  { id: "reports:read", label: "Reports Read", group: "Reports" },
  { id: "analytics:read", label: "Analytics Read", group: "Analytics" },
];

export default function APIKeys() {
  const [keys, setKeys] = useState<AdminAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<{ secret: string; name: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createScopes, setCreateScopes] = useState<string[]>(["users:read", "products:read"]);
  const [createRateLimit, setCreateRateLimit] = useState(100);
  const [createExpiresAt, setCreateExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingKey, setEditingKey] = useState<AdminAPIKey | null>(null);
  const [editName, setEditName] = useState("");
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [editRateLimit, setEditRateLimit] = useState(100);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editExpiresAt, setEditExpiresAt] = useState("");

  // Delete Modal State
  const [deletingKey, setDeletingKey] = useState<AdminAPIKey | null>(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await apiKeysService.getApiKeys(page, 25, search);
      setKeys(res.items || []);
      setTotal(res.total || 0);
    } catch {
      toast.error("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [page, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) {
      toast.error("Key name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiKeysService.createApiKey({
        name: createName.trim(),
        scopes: createScopes,
        rate_limit: createRateLimit,
        expires_at: createExpiresAt || undefined,
      });

      setShowCreateModal(false);
      setNewKeyResult({ secret: res.secretKey, name: res.apiKey.name });
      setCreateName("");
      setCreateScopes(["users:read", "products:read"]);
      setCreateRateLimit(100);
      setCreateExpiresAt("");
      fetchKeys();
      toast.success("API Key generated successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create API Key";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKey) return;
    setIsSubmitting(true);
    try {
      await apiKeysService.updateApiKey(editingKey.id, {
        name: editName.trim(),
        scopes: editScopes,
        rate_limit: editRateLimit,
        is_active: editIsActive,
        expires_at: editExpiresAt || undefined,
      });
      setEditingKey(null);
      fetchKeys();
      toast.success("API Key updated successfully.");
    } catch {
      toast.error("Failed to update API Key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingKey) return;
    setIsSubmitting(true);
    try {
      await apiKeysService.deleteApiKey(deletingKey.id);
      setDeletingKey(null);
      fetchKeys();
      toast.success("API Key revoked and deleted.");
    } catch {
      toast.error("Failed to delete API Key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySecret = () => {
    if (!newKeyResult) return;
    navigator.clipboard.writeText(newKeyResult.secret);
    setCopiedSecret(true);
    toast.success("Secret key copied to clipboard!");
    setTimeout(() => setCopiedSecret(false), 3000);
  };

  const filteredKeys = keys.filter((k) => {
    if (statusFilter === "active") return k.is_active;
    if (statusFilter === "disabled") return !k.is_active;
    return true;
  });

  const activeCount = keys.filter((k) => k.is_active).length;
  const disabledCount = keys.filter((k) => !k.is_active).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-gradient-to-tr from-primary/20 via-amber-500/20 to-primary/10 border border-primary/30 text-primary shadow-inner">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-black text-foreground tracking-tight font-display">
              API Keys Management
            </h1>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
              ADMIN CONTROL
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Generate, scope, rate limit, and revoke secure API keys for external integrations and services.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-primary via-amber-500 to-primary text-white dark:text-black font-extrabold text-xs shadow-lg shadow-primary/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Generate New API Key</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Total API Keys</span>
            <Key className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground font-mono">{total}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Active Keys</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500 font-mono">{activeCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Disabled / Revoked</span>
            <Lock className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-500 font-mono">{disabledCount}</p>
        </div>

        <div className="p-4 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Max Default Rate</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500 font-mono">100 req/min</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search API keys by name or prefix..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({keys.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === "active" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("disabled")}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === "disabled" ? "bg-red-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Disabled ({disabledCount})
            </button>
          </div>

          <button
            onClick={fetchKeys}
            className="p-2 rounded-xl border border-border/80 bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/60 bg-secondary/40 text-muted-foreground font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Key Name & Prefix</th>
                <th className="p-4">Owner / Scope</th>
                <th className="p-4">Rate Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Used</th>
                <th className="p-4">Expires</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading API keys...
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No API keys found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => {
                  const scopeList = (k.scopes || "read").split(",").map((s) => s.trim());
                  return (
                    <tr key={k.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <div className="font-extrabold text-foreground text-sm font-display flex items-center gap-2">
                            <span>{k.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-md w-fit border border-border/40">
                            <Lock className="h-3 w-3 text-primary" />
                            <span>{k.key_prefix}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground block">{k.user_email}</span>
                          <div className="flex flex-wrap gap-1">
                            {scopeList.map((sc) => (
                              <span
                                key={sc}
                                className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                              >
                                {sc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-foreground">
                        {k.rate_limit} req/min
                      </td>

                      <td className="p-4">
                        {k.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Revoked
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-muted-foreground">
                        {k.last_used_at ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span>{new Date(k.last_used_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic">Never</span>
                        )}
                      </td>

                      <td className="p-4 text-muted-foreground">
                        {k.expires_at ? (
                          <span>{new Date(k.expires_at).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-emerald-500 font-bold text-[11px]">Never</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingKey(k);
                              setEditName(k.name);
                              setEditScopes((k.scopes || "read").split(",").map((s) => s.trim()));
                              setEditRateLimit(k.rate_limit || 100);
                              setEditIsActive(k.is_active);
                              setEditExpiresAt(k.expires_at || "");
                            }}
                            className="p-1.5 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Edit Scopes & Settings"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingKey(k)}
                            className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                            title="Revoke / Delete API Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-6 shadow-2xl space-y-5 overflow-hidden backdrop-blur-2xl">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground font-display">Generate New API Key</h2>
                  <p className="text-xs text-muted-foreground">Configure name, scope permissions, and rate limits.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1">Key Description / Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Production Analytics Worker / Zapier Integration"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Permission Scopes</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-secondary/40 border border-border/60">
                  {AVAILABLE_SCOPES.map((sc) => {
                    const checked = createScopes.includes(sc.id);
                    return (
                      <label
                        key={sc.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                          checked ? "border-primary/40 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setCreateScopes([...createScopes, sc.id]);
                            else setCreateScopes(createScopes.filter((s) => s !== sc.id));
                          }}
                          className="rounded border-primary text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>{sc.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={createRateLimit}
                    onChange={(e) => setCreateRateLimit(Number(e.target.value))}
                    min={10}
                    max={1000}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={createExpiresAt}
                    onChange={(e) => setCreateExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border/80 text-xs font-extrabold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Generating..." : "Create API Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE-TIME SECRET DISPLAY MODAL */}
      {newKeyResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-card p-6 shadow-2xl space-y-5 overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center gap-3 text-amber-500 border-b border-border/60 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="h-5 w-5 text-amber-500 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base font-black text-foreground font-display">Save Your API Key Secret</h2>
                <p className="text-xs text-amber-500 font-bold">You will not be able to view this secret again!</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-foreground block">Key Name: {newKeyResult.name}</span>
              <div className="relative flex items-center p-3 rounded-2xl bg-secondary/80 border border-primary/40 font-mono text-xs text-primary font-bold break-all shadow-inner">
                <span className="pr-10">{newKeyResult.secret}</span>
                <button
                  onClick={handleCopySecret}
                  className="absolute right-2 p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                  title="Copy API Key"
                >
                  {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium space-y-1">
              <p className="font-bold">⚠️ Security Notice:</p>
              <p>Store this secret in your environment variables or key vault. Payent stores only the cryptographic hash and prefix in TiDB Cloud.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setNewKeyResult(null)}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer text-center"
              >
                I Have Saved The Secret Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT API KEY MODAL */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-6 shadow-2xl space-y-5 overflow-hidden backdrop-blur-2xl">
            <div className="flex items-start justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground font-display">Edit API Key</h2>
                  <p className="text-xs text-muted-foreground">{editingKey.key_prefix}...</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1">Key Description / Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Permission Scopes</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-secondary/40 border border-border/60">
                  {AVAILABLE_SCOPES.map((sc) => {
                    const checked = editScopes.includes(sc.id);
                    return (
                      <label
                        key={sc.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                          checked ? "border-primary/40 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) setEditScopes([...editScopes, sc.id]);
                            else setEditScopes(editScopes.filter((s) => s !== sc.id));
                          }}
                          className="rounded border-primary text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span>{sc.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    value={editRateLimit}
                    onChange={(e) => setEditRateLimit(Number(e.target.value))}
                    min={10}
                    max={1000}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1">Status</label>
                  <select
                    value={editIsActive ? "active" : "disabled"}
                    onChange={(e) => setEditIsActive(e.target.value === "active")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/80 bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled / Revoked</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="px-4 py-2.5 rounded-xl border border-border/80 text-xs font-extrabold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / REVOKE CONFIRMATION MODAL */}
      {deletingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-red-500/40 bg-card p-6 shadow-2xl space-y-4 overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center gap-3 text-red-500">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <h2 className="text-base font-black text-foreground font-display">Revoke & Delete API Key?</h2>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Are you sure you want to revoke <span className="font-extrabold text-foreground">"{deletingKey.name}"</span>? Any integration using this API key will immediately stop working.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <button
                onClick={() => setDeletingKey(null)}
                className="px-4 py-2 rounded-xl border border-border/80 text-xs font-extrabold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? "Revoking..." : "Yes, Revoke Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
