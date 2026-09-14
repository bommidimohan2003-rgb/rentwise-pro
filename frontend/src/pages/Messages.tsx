import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Inbox,
  User,
  ShieldCheck,
  X,
  Truck,
  MapPin,
  ExternalLink,
  Package,
  Navigation,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import type { RealtimeConversation, RealtimeMessage, DeliveryStatus } from "@/types";
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

function getDeliveryStatusBadge(status?: DeliveryStatus | string) {
  switch (status) {
    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for Delivery",
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        pulse: true,
      };
    case "NEAR_DESTINATION":
      return {
        label: "Near Destination",
        color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
        pulse: true,
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        pulse: false,
      };
    case "PREPARING":
      return {
        label: "Preparing Gear",
        color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        pulse: false,
      };
    case "READY":
      return {
        label: "Ready for Pickup",
        color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
        pulse: false,
      };
    case "PENDING":
    default:
      return {
        label: "Pending Dispatch",
        color: "bg-secondary text-muted-foreground border-border",
        pulse: false,
      };
  }
}

export default function Messages() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<RealtimeConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<RealtimeConversation | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // New Inquiry Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubject, setModalSubject] = useState("");
  const [modalCategory, setModalCategory] = useState(inquiryCategories[0]);
  const [modalMessage, setModalMessage] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initial Load of Conversations and URL bookingId handling
  const loadConversations = useCallback(async (preferredId?: string) => {
    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      
      // Check if URL has ?bookingId=
      const searchParams = new URLSearchParams(window.location.search);
      const bookingIdParam = searchParams.get("bookingId");
      
      let targetConvId = preferredId;

      // If a bookingId was passed in the query, fetch/create its conversation first
      if (bookingIdParam) {
        try {
          const bookingConvRes = await api.getBookingConversation(token, bookingIdParam);
          if (bookingConvRes.success && bookingConvRes.conversation) {
            targetConvId = bookingConvRes.conversation.id;
          }
        } catch (e) {
          console.warn("Could not pre-load booking conversation:", e);
        }
      }

      const res = await api.getRealtimeConversations(token);
      const list = res.conversations || [];
      setConversations(list);

      if (list.length > 0) {
        if (targetConvId && list.some((c) => c.id === targetConvId)) {
          setActiveId(targetConvId);
        } else if (!activeId || !list.some((c) => c.id === activeId)) {
          setActiveId(targetConvId || list[0].id);
        }
      } else {
        setActiveId(null);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to load conversations.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    if (ready && user) {
      loadConversations();
    } else if (ready && !user) {
      setLoading(false);
    }
  }, [ready, user?.email, loadConversations]);

  // 2. Load Active Conversation Detail
  const loadActiveThread = useCallback(async (convId: string, showSpinner = false) => {
    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token || !convId) return;

    if (showSpinner) setThreadLoading(true);
    try {
      const res = await api.getRealtimeConversationDetail(token, convId);
      if (res.success && res.conversation) {
        setActiveConversation(res.conversation);
        setMessages(res.conversation.messages || []);

        // Mark read
        api.markRealtimeConversationRead(token, convId).catch(() => {});
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, unread: false, unreadCount: 0 } : c,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to load conversation detail:", err);
    } finally {
      if (showSpinner) setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      loadActiveThread(activeId, true);
    } else {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [activeId, loadActiveThread]);

  // 3. Real-time WebSocket connection for active thread + Polling fallback
  useEffect(() => {
    if (!activeId) return;
    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) return;

    // Build WebSocket URL from API_BASE / VITE_API_URL
    let wsUrl: string;
    const apiBase =
      import.meta.env.VITE_API_URL ||
      (typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
        ? "http://127.0.0.1:8001"
        : typeof window !== "undefined"
          ? window.location.origin
          : "");
    const wsProto = apiBase.startsWith("https") ? "wss" : "ws";
    const cleanHost = apiBase.replace(/^https?:\/\//, "");
    wsUrl = `${wsProto}://${cleanHost}/api/conversations/${activeId}/ws?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let pingTimer: ReturnType<typeof setInterval> | null = null;

      ws.onopen = () => {
        if (isSubscribed) setWsConnected(true);
        // Send keepalive ping every 25 seconds to keep connection alive through proxies
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message.received" && data.message) {
            const newMsg = data.message as RealtimeMessage;
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Update last message in conversation sidebar
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeId
                  ? {
                      ...c,
                      lastMessage: newMsg.content,
                      lastMessageAt: newMsg.created_at,
                    }
                  : c,
              ),
            );
          } else if (data.type === "delivery.status") {
            // Delivery status updated; refresh conversation details
            loadActiveThread(activeId, false);
          }
        } catch (e) {
          console.error("Failed to parse websocket message:", e);
        }
      };

      ws.onerror = () => {
        if (isSubscribed) setWsConnected(false);
      };

      ws.onclose = () => {
        if (isSubscribed) setWsConnected(false);
        if (pingTimer) clearInterval(pingTimer);
      };
    } catch {
      setWsConnected(false);
    }

    // Polling fallback every 8 seconds for resilient cross-environment syncing
    const pollInterval = setInterval(() => {
      if (isSubscribed) {
        loadActiveThread(activeId, false);
      }
    }, 8000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
    };
  }, [activeId, loadActiveThread]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // 4. Send Message Handler
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

    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticMsg: RealtimeMessage = {
      id: tempId,
      conversation_id: activeId,
      sender_email: user?.email || "",
      sender_name: user?.fullName || "You",
      message_type: "TEXT",
      content: messageText,
      created_at: nowIso,
      updated_at: nowIso,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, lastMessage: messageText, lastMessageAt: nowIso }
          : c,
      ),
    );

    try {
      const res = await api.sendRealtimeMessage(token, activeId, messageText);
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m)),
        );
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to send message.");
      // Rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // 5. Create New Inquiry Modal Handler
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
        await loadConversations(res.id);
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
            Directly coordinate with lenders and renters, track delivery progress, and
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

  const deliveryBadge = activeConversation?.deliveryStatus
    ? getDeliveryStatusBadge(activeConversation.deliveryStatus)
    : null;

  return (
    <MainLayout>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Rental Coordination & Support
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary" />
              <span>Real-Time Messages</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>New Support Inquiry</span>
            </Button>
          </div>
        </div>

        {/* Main Messenger Container */}
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[680px] max-h-[820px]">
          {/* LEFT: Conversation List */}
          <div
            className={cn(
              "md:col-span-5 lg:col-span-4 border-r border-border flex-col bg-secondary/15 h-[680px] md:h-auto",
              activeId ? "hidden md:flex" : "flex",
            )}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Conversations ({conversations.length})
              </div>
              <button
                onClick={() => loadConversations()}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Refresh conversations"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {loading ? (
                <div className="p-6 space-y-4">
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
                    onClick={() => loadConversations()}
                    className="mt-3 text-xs font-bold underline cursor-pointer"
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
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                    When you book or list equipment, booking chat channels are created automatically.
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-xl text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span>Start Support Inquiry</span>
                  </Button>
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = c.id === activeId;
                  const itemBadge = c.deliveryStatus
                    ? getDeliveryStatusBadge(c.deliveryStatus)
                    : null;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-secondary/60 cursor-pointer",
                        isSelected && "bg-secondary/90 border-l-4 border-l-primary",
                      )}
                    >
                      {c.productImage ? (
                        <img
                          src={c.productImage}
                          alt=""
                          className="h-11 w-11 rounded-xl object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-foreground truncate">
                            {c.counterparty?.name || c.productTitle || "Rental Conversation"}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            {formatTimeAgo(c.lastMessageAt || c.updatedAt || c.createdAt)}
                          </span>
                        </div>

                        {c.productTitle && (
                          <div className="text-[11px] font-medium text-foreground/80 truncate mb-1">
                            {c.productTitle}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {c.lastMessage || "No messages in thread"}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                          {itemBadge && (
                            <span
                              className={cn(
                                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                                itemBadge.color,
                              )}
                            >
                              {itemBadge.label}
                            </span>
                          )}
                          {c.bookingId && (
                            <span className="text-[9px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
                              #{c.bookingId}
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

          {/* RIGHT: Active Thread View */}
          <div
            className={cn(
              "md:col-span-7 lg:col-span-8 flex-col h-[680px] md:h-auto bg-card",
              activeId ? "flex" : "hidden md:flex",
            )}
          >
            {activeConversation ? (
              <>
                {/* Header with Counterparty, Gear details, Delivery badge, and Live Map CTA */}
                <div className="p-3.5 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/15">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Back button */}
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="md:hidden p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    {activeConversation.productImage ? (
                      <img
                        src={activeConversation.productImage}
                        alt=""
                        className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                          {activeConversation.counterparty?.name || "Rental Partner"}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-secondary text-muted-foreground uppercase">
                          {activeConversation.counterparty?.role || (activeConversation.isCustomer ? "Lender" : "Renter")}
                        </span>
                        {deliveryBadge && (
                          <span
                            className={cn(
                              "text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border",
                              deliveryBadge.color,
                            )}
                          >
                            {deliveryBadge.label}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 truncate">
                        {activeConversation.productTitle && (
                          <span className="font-medium text-foreground">
                            {activeConversation.productTitle}
                          </span>
                        )}
                        {activeConversation.bookingId && (
                          <>
                            <span>•</span>
                            <span>Order #{activeConversation.bookingId}</span>
                          </>
                        )}
                        {wsConnected && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Live
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Header CTA */}
                  <div className="flex items-center gap-2 shrink-0">
                    {activeConversation.bookingId && (
                      <button
                        onClick={() =>
                          navigate({
                            to: `/delivery/${activeConversation.bookingId}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:opacity-95 transition-all cursor-pointer"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>View Live Map</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5"
                >
                  {threadLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-semibold text-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Coordinate handover time, pickup notes, or equipment setup instructions directly.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe =
                        m.sender_email.toLowerCase() ===
                        (user?.email || "").toLowerCase();
                      const isSystem = m.message_type === "SYSTEM";

                      if (isSystem) {
                        return (
                          <div
                            key={m.id}
                            className="my-3 flex flex-col items-center justify-center"
                          >
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border text-xs text-muted-foreground shadow-2xs">
                              <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-medium text-foreground">{m.content}</span>
                              <span className="text-[10px] text-muted-foreground/70">
                                {formatTimeAgo(m.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col",
                            isMe ? "items-end" : "items-start",
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              {isMe ? "You" : m.sender_name || "Partner"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {formatTimeAgo(m.created_at)}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "max-w-md sm:max-w-lg px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap",
                              isMe
                                ? "bg-[#161616] text-[#FFFFFF] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] rounded-tr-sm font-medium"
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
                  className="p-3.5 sm:p-4 border-t border-border bg-secondary/10 flex items-center gap-2.5"
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
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1 h-11 px-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-xs sm:text-sm outline-none focus:border-primary transition-all disabled:opacity-50 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:opacity-95 flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <Inbox className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold text-foreground">Select a Conversation</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Choose a rental order or support thread from the left to coordinate delivery and gear handoff.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Support Inquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">New Support Inquiry</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Category
                </label>
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-foreground text-xs font-medium outline-none focus:border-primary"
                >
                  {inquiryCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Question about insurance coverage"
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your question or issue in detail..."
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-card text-foreground text-xs outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={modalSubmitting}
                  className="text-xs font-semibold"
                >
                  {modalSubmitting ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
