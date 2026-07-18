import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Inbox,
  Send,
  User,
  Shield,
  CheckCircle,
  XCircle,
  LifeBuoy,
  AlertCircle,
} from "lucide-react";
import { notificationsService } from "../services/notifications";
import { AdminSupportTicket } from "../services/api";
import { Loader } from "../components/layout/Loader";
import { EmptyState } from "../components/layout/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Support() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "open" | "pending" | "resolved" | "closed">(
    "open",
  );
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);

  // Message reply content
  const [reply, setReply] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getSupportTickets();
      setTickets(data);

      // Select first open ticket by default if any
      const openOnes = data.filter((t) => t.status === "open");
      if (openOnes.length > 0) {
        setSelectedTicket(openOnes[0]);
      } else if (data.length > 0) {
        setSelectedTicket(data[0]);
      }
    } catch {
      toast.error("Failed to load help-desk tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;

    setSubmittingReply(true);
    try {
      const updated = await notificationsService.replyToTicket(selectedTicket.id, reply);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
      setSelectedTicket(updated);
      setReply("");
      toast.success("Response sent to customer.");
    } catch {
      toast.error("Failed to submit reply.");
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
          t.subject.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }

    if (statusTab !== "all") {
      result = result.filter((t) => t.status === statusTab);
    }

    return result;
  }, [tickets, search, statusTab]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Support Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verify lender/renter dispute tickets, reply to issues, and assign resolutions.
        </p>
      </div>

      {/* Main panel layout split */}
      {loading ? (
        <Loader message="Fetching ticket records..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-h-[500px]">
          {/* Left 1 Col: Tickets List */}
          <div className="flex flex-col gap-4">
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-9 pr-4 py-2.5 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Status scroll tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-secondary/30 p-1 rounded-xl border border-border/50">
                {(["all", "open", "pending", "resolved", "closed"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider text-muted-foreground transition-all shrink-0",
                      statusTab === tab && "bg-card text-foreground shadow-xs",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List of scrollable cards */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 max-h-[450px]">
              {filteredTickets.length === 0 ? (
                <EmptyState
                  title="No tickets"
                  description="No tickets match this filter."
                  icon={LifeBuoy}
                />
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={cn(
                        "card-premium p-4 bg-card/60 cursor-pointer border-l-4 hover:border-l-primary relative transition-all",
                        isSelected
                          ? "border-l-primary bg-primary/5 ring-1 ring-primary/10"
                          : "border-l-transparent",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-primary">
                          {t.category}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full select-none",
                            t.priority === "high" &&
                              "bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse",
                            t.priority === "medium" && "bg-amber-500/10 text-amber-600",
                            t.priority === "low" && "bg-secondary text-muted-foreground",
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground truncate mt-1">
                        {t.subject}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-3 font-semibold">
                        <span>{t.userName}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right 2 Cols: Active thread panel */}
          <div className="lg:col-span-2 card-premium bg-card/60 p-5 flex flex-col justify-between max-h-[570px]">
            {selectedTicket ? (
              <div className="flex flex-col h-full justify-between">
                {/* Thread header */}
                <div className="flex items-start justify-between border-b border-border/40 pb-4 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{selectedTicket.subject}</h3>
                    <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                      Client: {selectedTicket.userName} ({selectedTicket.userEmail}) • Category:{" "}
                      {selectedTicket.category}
                    </p>
                  </div>

                  {/* Actions status controls */}
                  <div className="flex items-center gap-1.5">
                    {selectedTicket.status !== "resolved" && (
                      <button
                        onClick={() => handleUpdateStatus("resolved")}
                        className="bg-green-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl hover:bg-green-500 transition-colors shadow-xs uppercase tracking-wider"
                      >
                        Resolve
                      </button>
                    )}
                    {selectedTicket.status !== "closed" && (
                      <button
                        onClick={() => handleUpdateStatus("closed")}
                        className="bg-secondary text-foreground text-[10px] font-extrabold px-3 py-1.5 rounded-xl hover:bg-secondary/80 transition-colors border border-border/80 uppercase tracking-wider"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4 my-2">
                  {selectedTicket.messages.map((m) => {
                    const isAdmin = m.sender === "admin";
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex items-start gap-3 max-w-[85%]",
                          isAdmin ? "ml-auto flex-row-reverse" : "mr-auto",
                        )}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-xl shrink-0 mt-0.5",
                            isAdmin ? "bg-primary text-white" : "bg-secondary text-foreground",
                          )}
                        >
                          {isAdmin ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : (
                            <User className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div
                            className={cn(
                              "rounded-2xl p-3 text-xs font-semibold leading-relaxed",
                              isAdmin
                                ? "bg-primary/10 border border-primary/20 text-foreground"
                                : "bg-secondary/40 border border-border/40 text-foreground",
                            )}
                          >
                            {m.message}
                          </div>
                          <span
                            className={cn(
                              "text-[9px] font-semibold text-muted-foreground/60 mt-1",
                              isAdmin ? "text-right" : "text-left",
                            )}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chat text box reply */}
                {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" ? (
                  <form
                    onSubmit={handleSendReply}
                    className="flex items-center gap-2.5 border-t border-border/40 pt-4 shrink-0"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Write response message..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="w-full bg-secondary/50 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary focus:bg-card focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply}
                      className="btn-gradient p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-secondary/35 border border-dashed rounded-xl shrink-0 justify-center text-xs text-muted-foreground font-semibold">
                    <AlertCircle className="h-4.5 w-4.5 text-muted-foreground" />
                    <span>This support ticket has been {selectedTicket.status} and locked.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Inbox className="h-10 w-10 opacity-30 mb-2.5" />
                <p className="text-xs font-bold">
                  Select a ticket from the side-list to inspect thread.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
