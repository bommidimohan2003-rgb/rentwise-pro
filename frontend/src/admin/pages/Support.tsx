import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Search,
  Send,
  User,
  Shield,
  LifeBuoy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { notificationsService } from "../services/notifications";
import { AdminSupportTicket } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Support() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);

  // Reply state
  const [reply, setReply] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await notificationsService.getSupportTickets();
      setTickets(data);

      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err) {
      console.error(err);
      if (!silent) setError("Support service is not configured or unreachable.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedTicket]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;

    try {
      setSubmittingReply(true);
      const updated = await notificationsService.replyToTicket(selectedTicket.id, reply.trim());
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
      setSelectedTicket(updated);
      setReply("");
      toast.success("Response sent to customer.");
    } catch {
      toast.error("Failed to submit support reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (status: AdminSupportTicket["status"]) => {
    if (!selectedTicket) return;

    try {
      const updated = await notificationsService.updateTicketStatus(selectedTicket.id, status);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
      setSelectedTicket(updated);
      toast.info(`Ticket status updated to ${status}.`);
    } catch {
      toast.error("Failed to modify ticket status.");
    }
  };

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          (t.userName && t.userName.toLowerCase().includes(q)) ||
          (t.userEmail && t.userEmail.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result;
  }, [tickets, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
            Support Desk & Triage
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authoritative ticket thread resolution, user inquiries, and operational support tickets.
          </p>
        </div>

        <button
          onClick={() => fetchTickets()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card hover:bg-secondary border border-border/80 text-foreground text-xs font-bold transition-all cursor-pointer shadow-2xs self-start md:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ERROR / UNCONFIGURED BANNER */}
      {error && !loading && (
        <div className="bg-card rounded-2xl border border-destructive/30 p-8 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground font-display">Database Sync Failed</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
          <button
            onClick={() => fetchTickets()}
            className="mt-4 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Retry Database Fetch
          </button>
        </div>
      )}

      {/* TICKET SPLIT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* TICKET LIST PANEL */}
        <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col h-[650px]">
          {/* Filters */}
          <div className="p-3 border-b border-border/40 space-y-2 bg-secondary/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card text-foreground text-xs rounded-xl pl-8 pr-3 py-1.5 border border-border/80 focus:outline-none font-medium"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px] font-bold">
              {["all", "open", "pending", "resolved", "closed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all cursor-pointer",
                    statusFilter === st ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/20">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No tickets found.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={cn(
                      "p-3.5 cursor-pointer transition-colors text-xs space-y-1.5",
                      isSelected ? "bg-secondary/70 border-l-3 border-primary" : "hover:bg-secondary/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground truncate max-w-[180px]">{t.subject}</span>
                      <span
                        className={cn(
                          "text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border",
                          t.status === "open"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : t.status === "resolved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-secondary text-muted-foreground border-border/60"
                        )}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate">{t.userName} ({t.userEmail})</p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{t.category || "General"}</span>
                      <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TICKET CONVERSATION THREAD */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/80 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border/40 bg-secondary/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedTicket.subject}</h3>
                  <p className="text-xs text-muted-foreground">
                    From: <span className="font-semibold text-foreground">{selectedTicket.userName}</span> ({selectedTicket.userEmail})
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as AdminSupportTicket["status"])}
                    className="bg-card text-foreground text-xs rounded-xl px-2.5 py-1.5 border border-border font-bold uppercase cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "p-3.5 rounded-xl max-w-lg space-y-1 leading-relaxed",
                        m.sender === "admin"
                          ? "ml-auto bg-primary text-primary-foreground font-medium"
                          : "bg-secondary border border-border/60 text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold opacity-75">
                        <span>{m.sender === "admin" ? "Support Admin" : selectedTicket.userName}</span>
                        <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </div>
                      <p>{m.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No replies sent yet in this ticket thread.
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-border/40 bg-secondary/20 flex gap-2">
                <input
                  type="text"
                  placeholder="Type an official admin response..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-card border border-border/80 text-foreground text-xs font-medium focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={submittingReply || !reply.trim()}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Select a ticket to view thread history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
