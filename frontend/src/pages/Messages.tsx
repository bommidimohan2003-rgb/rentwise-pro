import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Inbox,
  User,
  ShieldCheck,
  X,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import type { Conversation, ConversationMessage } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const inquiryCategories = [
  "Rental Question",
  "Lender Support",
  "Account & Verification",
  "Payment & Refund",
  "Technical Issue",
  "General Inquiry",
];

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function Messages() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // New Inquiry Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState("");
  const [modalCategory, setModalCategory] = useState(inquiryCategories[0]);
  const [modalMessage, setModalMessage] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async (selectFirst = false) => {
    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await api.getMessages(token);
      setConversations(data);
      if (data.length > 0) {
        if (selectFirst || !activeId || !data.some((c) => c.id === activeId)) {
          setActiveId(data[0].id);
        }
      } else {
        setActiveId(null);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      loadConversations(true);
    }
  }, [ready, user?.email]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const activeConv = conversations.find((c) => c.id === activeId) || null;

  useEffect(() => {
    scrollToBottom();
    // Mark conversation read on selection
    if (activeConv && activeConv.unread) {
      const token = storage.get<string | null>(STORAGE_KEYS.token, null);
      if (token) {
        api.markConversationRead(token, activeConv.id).catch(() => {});
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, unread: false, unreadCount: 0 }
              : c,
          ),
        );
      }
    }
  }, [activeId, activeConv?.messages?.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !activeId || sending) return;

    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      toast.error("Please sign in to send messages.");
      return;
    }

    const messageText = input.trim();
    setInput("");
    setSending(true);

    // Optimistic message update
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticMsg: ConversationMessage = {
      id: tempId,
      sender: user?.fullName || user?.email?.split("@")[0] || "You",
      senderType: "user",
      content: messageText,
      timestamp: nowIso,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: messageText,
              lastMessageAt: nowIso,
              messages: [...c.messages, optimisticMsg],
            }
          : c,
      ),
    );

    try {
      const res = await api.sendMessage(token, activeId, messageText);
      if (res.success && res.messages) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  messages: res.messages,
                  lastMessage: messageText,
                  lastMessageAt: res.updatedAt || nowIso,
                }
              : c,
          ),
        );
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to send message.");
      // Rollback optimistic update
      loadConversations();
    } finally {
      setSending(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalSubject.trim() || modalSubject.trim().length < 3) {
      setModalError("Subject must be at least 3 characters.");
      return;
    }
    if (!modalMessage.trim() || modalMessage.trim().length < 5) {
      setModalError("Message must be at least 5 characters.");
      return;
    }

    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      setModalError("Please sign in first.");
      return;
    }

    setModalSubmitting(true);
    try {
      const res = await api.createConversation(token, {
        subject: modalSubject.trim(),
        category: modalCategory,
        message: modalMessage.trim(),
      });

      if (res.success && res.id) {
        toast.success("Inquiry created successfully.");
        setIsModalOpen(false);
        setModalSubject("");
        setModalMessage("");
        await loadConversations();
        setActiveId(res.id);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setModalError(e.message || "Failed to create inquiry.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Auth wall
  if (ready && !user) {
    return (
      <MainLayout>
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary mx-auto flex items-center justify-center text-primary mb-6">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Sign In to Access Messages
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Directly coordinate with lenders, manage booking questions, and
            receive real-time equipment support.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#161616] text-[#FFFFFF] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] text-sm font-bold shadow-md hover:opacity-90 transition-all"
            >
              Sign In to Payent
            </Link>
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Creator & Support Messages
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary" />
              <span>Inbox Messages</span>
            </h1>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#161616] text-[#FFFFFF] hover:bg-[#292929] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:hover:bg-[#FFFFFF] text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Inquiry</span>
          </Button>
        </div>

        {/* Main Messenger Container */}
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[650px] max-h-[750px]">
          {/* LEFT: Conversation List (4 cols on desktop) */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-border flex flex-col bg-secondary/15">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                All Conversations ({conversations.length})
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {loading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="p-4 rounded-2xl bg-secondary/40 animate-pulse space-y-2"
                    >
                      <div className="h-4 w-2/3 bg-secondary rounded" />
                      <div className="h-3 w-1/2 bg-secondary rounded" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center text-xs text-destructive">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>{error}</p>
                  <button
                    onClick={() => loadConversations(true)}
                    className="mt-3 text-xs font-bold underline"
                  >
                    Try Again
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Inbox className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-bold text-foreground">
                    No conversations yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Create a new inquiry or contact support to begin.
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-full text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Start Inquiry</span>
                  </Button>
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full text-left p-4 transition-all flex items-start gap-3.5 hover:bg-secondary/60 cursor-pointer",
                        isSelected && "bg-secondary/90 border-l-4 border-l-primary",
                      )}
                    >
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        <MessageSquare className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-foreground truncate">
                            {c.subject}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            {formatTimeAgo(c.lastMessageAt || c.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {c.lastMessage || "No messages in thread"}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                              c.status === "open"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : c.status === "pending"
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {c.status}
                          </span>
                          {c.category && (
                            <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                              {c.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {c.unread && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Thread View (7-8 cols on desktop) */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full bg-card">
            {activeConv ? (
              <>
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4 bg-secondary/10">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                        {activeConv.subject}
                      </h2>
                      <span
                        className={cn(
                          "text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0",
                          activeConv.status === "open"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {activeConv.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{activeConv.partner || "Payent Support"}</span>
                      <span>•</span>
                      <span>
                        Created {new Date(activeConv.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground px-2.5 py-1 rounded-lg bg-secondary">
                      {activeConv.messages?.length || 0} messages
                    </span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                >
                  {activeConv.messages?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                      <p className="text-sm">No messages in this inquiry yet.</p>
                    </div>
                  ) : (
                    activeConv.messages.map((m, idx) => {
                      const isMe = m.senderType === "user";
                      return (
                        <div
                          key={m.id || idx}
                          className={cn(
                            "flex flex-col",
                            isMe ? "items-end" : "items-start",
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {isMe ? "You" : m.sender || "Support Specialist"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {formatTimeAgo(m.timestamp)}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "max-w-md sm:max-w-lg px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap",
                              isMe
                                ? "bg-[#161616] text-[#FFFFFF] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] rounded-tr-sm"
                                : "bg-secondary text-foreground border border-border rounded-tl-sm",
                            )}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send Box */}
                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-border bg-secondary/15 flex items-center gap-3"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message or response..."
                    disabled={sending}
                    className="flex-1 h-12 px-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-xs sm:text-sm outline-none focus:border-primary transition-all disabled:opacity-50"
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="h-12 w-12 rounded-2xl bg-[#161616] text-[#FFFFFF] hover:bg-[#292929] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:hover:bg-[#FFFFFF] flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold text-foreground">
                  Select a conversation
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Choose a thread from the left to read messages and reply, or
                  start a new inquiry.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Support & Inquiries
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Start a New Inquiry
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Send a message to our support and lender coordination team.
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInquiry} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Inquiry Category
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-secondary/50 text-foreground text-xs outline-none focus:border-primary"
                >
                  {inquiryCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Subject *
                </label>
                <input
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  placeholder="e.g. Question regarding camera pickup in Vizag"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Message *
                </label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe your inquiry or question in detail..."
                  className="w-full p-3.5 rounded-xl border border-border bg-card text-foreground text-xs outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                  className="rounded-full text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={modalSubmitting}
                  className="rounded-full bg-[#161616] text-[#FFFFFF] hover:bg-[#292929] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] dark:hover:bg-[#FFFFFF] text-xs font-bold"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Inquiry</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
