import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Paperclip,
  Image as ImageIcon,
  Search,
  Check,
  CheckCheck,
  Info,
  Calendar,
  IndianRupee,
  ChevronRight,
  Maximize2,
  Download,
} from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { storage, STORAGE_KEYS } from "@/utils/storage";
import type { RealtimeConversation, RealtimeMessage, DeliveryStatus } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

function formatMessageDate(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

function formatMessageTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

type FilterTab = "ALL" | "RENTALS" | "INQUIRIES";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Attachment state
  const [selectedAttachment, setSelectedAttachment] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
  } | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 1. Initial Load of Conversations and URL query handling
  const loadConversations = useCallback(async (preferredId?: string) => {
    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setError(null);

      // Check if URL has ?bookingId= or ?conversationId=
      const searchParams = new URLSearchParams(window.location.search);
      const bookingIdParam = searchParams.get("bookingId");
      const conversationIdParam = searchParams.get("conversationId");

      let targetConvId = preferredId || conversationIdParam || undefined;

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
        api
          .markRealtimeConversationRead(token, convId)
          .then(() => {
            window.dispatchEvent(new CustomEvent("payent:unread-messages-updated"));
          })
          .catch(() => {});
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

    let isSubscribed = true;

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
    const wsUrl = `${wsProto}://${cleanHost}/api/conversations/${activeId}/ws?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let pingTimer: ReturnType<typeof setInterval> | null = null;

      ws.onopen = () => {
        if (isSubscribed) setWsConnected(true);
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
          if ((data.type === "message.received" || data.type === "chat.message") && data.message) {
            const newMsg = data.message as RealtimeMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeId
                  ? {
                      ...c,
                      lastMessage: newMsg.content || "Shared an attachment",
                      lastMessageAt: newMsg.created_at,
                    }
                  : c,
              ),
            );
          } else if (data.type === "delivery.status") {
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

    // Polling fallback every 8 seconds
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

  // 4. File Attachment Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const previewUrl = URL.createObjectURL(file);
      setSelectedAttachment({ file, previewUrl, base64 });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    if (selectedAttachment?.previewUrl) {
      URL.revokeObjectURL(selectedAttachment.previewUrl);
    }
    setSelectedAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 5. Send Message Handler
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedAttachment) || !activeId || sending) return;

    const token = storage.get<string | null>(STORAGE_KEYS.token, null);
    if (!token) {
      toast.error("Please sign in to send messages.");
      return;
    }

    const messageText = input.trim();
    const currentAttachment = selectedAttachment;

    setInput("");
    setSelectedAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticMsg: RealtimeMessage = {
      id: tempId,
      conversation_id: activeId,
      sender_email: user?.email || "",
      sender_name: user?.fullName || "You",
      message_type: currentAttachment ? (currentAttachment.file.type.startsWith("image/") ? "IMAGE" : "FILE") : "TEXT",
      content: messageText || (currentAttachment ? `Shared ${currentAttachment.file.name}` : ""),
      created_at: nowIso,
      updated_at: nowIso,
      attachments: currentAttachment
        ? [
            {
              id: `att-temp-${Date.now()}`,
              message_id: tempId,
              file_url: currentAttachment.previewUrl || currentAttachment.base64,
              file_name: currentAttachment.file.name,
              file_type: currentAttachment.file.type,
              file_size: currentAttachment.file.size,
              created_at: nowIso,
            },
          ]
        : [],
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: optimisticMsg.content,
              lastMessageAt: nowIso,
            }
          : c,
      ),
    );

    try {
      let res;
      if (currentAttachment) {
        res = await api.sendRealtimeMessage(
          token,
          activeId,
          messageText || `Shared ${currentAttachment.file.name}`,
          currentAttachment.file.type.startsWith("image/") ? "IMAGE" : "FILE",
          currentAttachment.base64,
          currentAttachment.file.name,
          currentAttachment.file.type,
          currentAttachment.file.size,
        );
      } else {
        res = await api.sendRealtimeMessage(token, activeId, messageText);
      }

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m)),
        );
        window.dispatchEvent(new CustomEvent("payent:unread-messages-updated"));
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // 6. Quick Prompts
  const sendQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Tab filter
      if (activeTab === "RENTALS" && !c.bookingId) return false;
      if (activeTab === "INQUIRIES" && c.bookingId) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.counterparty?.name?.toLowerCase().includes(q);
        const matchProd = c.productTitle?.toLowerCase().includes(q);
        const matchBook = c.bookingId?.toLowerCase().includes(q);
        const matchLast = c.lastMessage?.toLowerCase().includes(q);
        return matchName || matchProd || matchBook || matchLast;
      }
      return true;
    });
  }, [conversations, activeTab, searchQuery]);

  // Auth wall
  if (ready && !user) {
    return (
      <MainLayout>
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <div className="h-16 w-16 rounded-3xl bg-secondary mx-auto flex items-center justify-center text-primary mb-6 shadow-sm">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Sign In to Access Messages
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
            Directly coordinate with lenders and renters, negotiate equipment rental details, and receive real-time delivery updates.
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
      <section className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Customer ↔ Lender Messenger
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span>Messages & Coordination</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadConversations()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
              title="Sync conversations"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>

        {/* 3-Column Messenger Container */}
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[700px] max-h-[860px]">
          {/* COLUMN 1: Conversations List */}
          <div
            className={cn(
              "md:col-span-4 lg:col-span-4 border-r border-border flex flex-col bg-secondary/10 h-[700px] md:h-auto",
              activeId ? "hidden md:flex" : "flex",
            )}
          >
            {/* Search and Tabs */}
            <div className="p-3.5 border-b border-border space-y-2.5 bg-card">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search lender, gear, or booking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/70"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-secondary/60 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setActiveTab("ALL")}
                  className={cn(
                    "py-1 rounded-lg transition-all text-center cursor-pointer",
                    activeTab === "ALL"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All ({conversations.length})
                </button>
                <button
                  onClick={() => setActiveTab("RENTALS")}
                  className={cn(
                    "py-1 rounded-lg transition-all text-center cursor-pointer",
                    activeTab === "RENTALS"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Rentals
                </button>
                <button
                  onClick={() => setActiveTab("INQUIRIES")}
                  className={cn(
                    "py-1 rounded-lg transition-all text-center cursor-pointer",
                    activeTab === "INQUIRIES"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Inquiries
                </button>
              </div>
            </div>

            {/* Conversation Items Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="p-3.5 rounded-2xl bg-secondary/30 animate-pulse space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-secondary shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-2/3 bg-secondary rounded" />
                          <div className="h-3 w-1/3 bg-secondary rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-6 text-center text-xs text-destructive">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p>{error}</p>
                  <button
                    onClick={() => loadConversations()}
                    className="mt-3 text-xs font-bold underline cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <Inbox className="h-9 w-9 text-muted-foreground/40 mb-2.5" />
                  <p className="text-xs font-bold text-foreground">
                    {searchQuery ? "No matching conversations" : "No conversations yet"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                    {searchQuery
                      ? "Try searching with different keywords."
                      : "When you inquire on a product or book equipment, conversations appear here."}
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isSelected = c.id === activeId;
                  const itemBadge = c.deliveryStatus
                    ? getDeliveryStatusBadge(c.deliveryStatus)
                    : null;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={cn(
                        "w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-secondary/60 cursor-pointer relative",
                        isSelected && "bg-secondary/90 border-l-4 border-l-primary",
                      )}
                    >
                      {/* Avatar with role badge */}
                      <div className="relative shrink-0">
                        {c.counterparty?.avatar ? (
                          <img
                            src={c.counterparty.avatar}
                            alt=""
                            className="h-11 w-11 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-secondary text-muted-foreground flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                        <span
                          className={cn(
                            "absolute -bottom-1 -right-1 text-[8px] font-black uppercase px-1 rounded-full border shadow-2xs",
                            c.counterparty?.role === "lender"
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
                          )}
                        >
                          {c.counterparty?.role === "lender" ? "Lender" : "Renter"}
                        </span>
                      </div>

                      {/* Content Snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-foreground truncate">
                              {c.counterparty?.name || "Rental Partner"}
                            </span>
                            {c.counterparty?.verified && (
                              <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            {formatTimeAgo(c.lastMessageAt || c.updatedAt || c.createdAt)}
                          </span>
                        </div>

                        {/* Product Title */}
                        <div className="text-[11px] font-semibold text-foreground/90 truncate flex items-center gap-1 mb-1">
                          <Package className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{c.productTitle || "Gear"}</span>
                          {c.productPrice && (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              (₹{c.productPrice}/day)
                            </span>
                          )}
                        </div>

                        {/* Last message preview */}
                        <p
                          className={cn(
                            "text-xs line-clamp-1",
                            c.unread
                              ? "font-bold text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {c.lastMessage || "Started a conversation"}
                        </p>

                        {/* Badges Footer */}
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
                              #{c.bookingId.slice(-8)}
                            </span>
                          )}
                          {!c.bookingId && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                              Pre-Booking Inquiry
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread dot / badge */}
                      {c.unread && (
                        <div className="shrink-0 flex flex-col items-end">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {c.unreadCount && c.unreadCount > 1 && (
                            <span className="text-[9px] font-bold text-primary mt-1">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: Active Chat Thread View */}
          <div
            className={cn(
              "flex flex-col h-[700px] md:h-auto bg-card relative",
              showRightPanel && activeConversation
                ? "md:col-span-8 lg:col-span-5"
                : "md:col-span-8 lg:col-span-8",
              activeId ? "flex" : "hidden md:flex",
            )}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between gap-3 bg-secondary/15">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobile Back button */}
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="md:hidden p-1.5 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer shrink-0"
                      aria-label="Back to conversation roster"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    {/* Counterparty avatar */}
                    <div className="relative shrink-0">
                      {activeConversation.counterparty?.avatar ? (
                        <img
                          src={activeConversation.counterparty.avatar}
                          alt=""
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-card",
                          wsConnected ? "bg-emerald-500" : "bg-amber-400",
                        )}
                        title={wsConnected ? "Real-time connected" : "Connecting..."}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {activeConversation.counterparty?.name || "Rental Partner"}
                        </h2>
                        {activeConversation.counterparty?.verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-secondary text-muted-foreground uppercase">
                          {activeConversation.counterparty?.role || (activeConversation.isCustomer ? "Lender" : "Renter")}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                        <span className="truncate font-medium text-foreground/80">
                          {activeConversation.productTitle || "Gear"}
                        </span>
                        {deliveryBadge && (
                          <>
                            <span>•</span>
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider border",
                                deliveryBadge.color,
                              )}
                            >
                              {deliveryBadge.label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions CTA */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeConversation.bookingId && (
                      <button
                        onClick={() =>
                          navigate({
                            to: `/delivery/${activeConversation.bookingId}`,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-2xs hover:opacity-90 transition-all cursor-pointer"
                        title="Open Live GPS Map"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Live Map</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowRightPanel((prev) => !prev)}
                      className={cn(
                        "p-2 rounded-xl border border-border text-xs font-semibold transition-colors cursor-pointer",
                        showRightPanel
                          ? "bg-secondary text-foreground"
                          : "bg-card text-muted-foreground hover:text-foreground",
                      )}
                      title="Toggle Gear & Booking Info"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 bg-card/60"
                >
                  {threadLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-bold text-foreground">Start the conversation</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Ask about equipment condition, pickup location, or rental logistics.
                      </p>

                      {/* Quick Prompt Suggestions */}
                      <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-md">
                        {[
                          "Is this available this weekend?",
                          "Can I pick it up at 10 AM?",
                          "Are all accessories included?",
                        ].map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => sendQuickPrompt(prompt)}
                            className="text-[11px] px-3 py-1 rounded-full bg-secondary border border-border text-foreground/80 hover:bg-secondary/90 transition-colors cursor-pointer"
                          >
                            "{prompt}"
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMe =
                        m.sender_email.toLowerCase() ===
                        (user?.email || "").toLowerCase();
                      const isSystem = m.message_type === "SYSTEM";

                      // Date separator check
                      const prevDate = idx > 0 ? formatMessageDate(messages[idx - 1].created_at) : null;
                      const currDate = formatMessageDate(m.created_at);
                      const showDateHeader = prevDate !== currDate;

                      return (
                        <div key={m.id} className="space-y-3">
                          {showDateHeader && (
                            <div className="my-2 flex justify-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/80 px-2.5 py-0.5 rounded-full border border-border">
                                {currDate}
                              </span>
                            </div>
                          )}

                          {isSystem ? (
                            <div className="my-2 flex flex-col items-center justify-center">
                              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/70 border border-border text-xs text-muted-foreground shadow-2xs max-w-md text-center">
                                <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                                <span className="font-medium text-foreground">{m.content}</span>
                                <span className="text-[10px] text-muted-foreground/70 shrink-0">
                                  {formatMessageTime(m.created_at)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "flex flex-col",
                                isMe ? "items-end" : "items-start",
                              )}
                            >
                              <div className="flex items-center gap-1.5 mb-1 px-1">
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {isMe ? "You" : m.sender_name || "Partner"}
                                </span>
                                <span className="text-[9px] text-muted-foreground/60">
                                  {formatMessageTime(m.created_at)}
                                </span>
                              </div>

                              <div
                                className={cn(
                                  "max-w-xs sm:max-w-md px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words",
                                  isMe
                                    ? "bg-[#161616] text-[#FFFFFF] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] rounded-tr-xs font-medium"
                                    : "bg-secondary text-foreground border border-border rounded-tl-xs",
                                )}
                              >
                                {/* Attachment Rendering if present */}
                                {m.attachments && m.attachments.length > 0 && (
                                  <div className="mb-2 space-y-1.5">
                                    {m.attachments.map((att) => (
                                      <div key={att.id} className="relative group rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                                        {att.file_type.startsWith("image/") ? (
                                          <div
                                            onClick={() => setLightboxImageUrl(att.file_url)}
                                            className="cursor-pointer relative overflow-hidden max-h-48"
                                          >
                                            <img
                                              src={att.file_url}
                                              alt={att.file_name || "Attachment"}
                                              className="w-full h-auto object-cover rounded-xl group-hover:scale-105 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                              <Maximize2 className="h-5 w-5" />
                                            </div>
                                          </div>
                                        ) : (
                                          <a
                                            href={att.file_url}
                                            download={att.file_name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-xl bg-background/20 text-xs font-semibold hover:underline"
                                          >
                                            <Paperclip className="h-4 w-4" />
                                            <span className="truncate">{att.file_name || "Download Attachment"}</span>
                                            <Download className="h-3.5 w-3.5 shrink-0 ml-auto" />
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div>{m.content}</div>

                                {isMe && (
                                  <div className="mt-1 flex justify-end items-center gap-1 text-[9px] opacity-70">
                                    {m.read_at ? (
                                      <CheckCheck className="h-3 w-3 text-emerald-400 inline" />
                                    ) : (
                                      <Check className="h-3 w-3 inline" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 sm:p-4 border-t border-border bg-card">
                  {/* Selected Attachment preview strip */}
                  {selectedAttachment && (
                    <div className="mb-2.5 p-2 rounded-2xl bg-secondary/70 border border-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectedAttachment.file.type.startsWith("image/") ? (
                          <img
                            src={selectedAttachment.previewUrl}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Paperclip className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {selectedAttachment.file.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {(selectedAttachment.file.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={removeAttachment}
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-2xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
                      title="Attach photo or document (max 5MB)"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                      rows={1}
                      className="flex-1 max-h-28 min-h-[42px] p-2.5 px-3.5 text-xs sm:text-sm rounded-2xl bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none text-foreground placeholder:text-muted-foreground"
                    />

                    <button
                      type="submit"
                      disabled={(!input.trim() && !selectedAttachment) || sending}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#161616] text-[#FFFFFF] dark:bg-[#F2F0EA] dark:text-[#0A0A0A] flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-all cursor-pointer shadow-xs"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-bold text-foreground">Select a conversation</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Choose a conversation from the list or message a lender directly from any gear listing.
                </p>
              </div>
            )}
          </div>

          {/* COLUMN 3: Right Context Rail (Gear & Booking & Delivery details) */}
          {showRightPanel && activeConversation && (
            <div className="hidden lg:flex lg:col-span-3 border-l border-border flex-col bg-secondary/5 overflow-y-auto p-4 space-y-4">
              {/* Product Card */}
              <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Gear Overview
                </div>

                <div className="flex gap-3 items-start">
                  <img
                    src={activeConversation.productImage || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600"}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground line-clamp-2">
                      {activeConversation.productTitle || "Gear Rental"}
                    </div>
                    {activeConversation.productPrice && (
                      <div className="text-xs font-black text-primary mt-1">
                        ₹{activeConversation.productPrice}
                        <span className="text-[10px] text-muted-foreground font-normal"> / day</span>
                      </div>
                    )}
                  </div>
                </div>

                {activeConversation.productId && (
                  <button
                    onClick={() => navigate({ to: `/product/${activeConversation.productId}` })}
                    className="w-full py-1.5 rounded-xl border border-border bg-secondary/40 text-[11px] font-bold text-foreground hover:bg-secondary transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Gear Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Booking & Rental Schedule */}
              {activeConversation.bookingId ? (
                <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Booking Details
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                      {activeConversation.bookingStatus || "Active"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground text-[11px]">
                      <span>Order Reference:</span>
                      <span className="font-bold text-foreground">#{activeConversation.bookingId.slice(-8)}</span>
                    </div>

                    {activeConversation.bookingStartDate && (
                      <div className="flex justify-between text-muted-foreground text-[11px]">
                        <span>Rental Period:</span>
                        <span className="font-semibold text-foreground">
                          {activeConversation.bookingStartDate} ➔ {activeConversation.bookingEndDate}
                        </span>
                      </div>
                    )}

                    {activeConversation.bookingTotal && (
                      <div className="flex justify-between text-muted-foreground text-[11px] pt-1 border-t border-border">
                        <span>Total Paid:</span>
                        <span className="font-black text-foreground">₹{activeConversation.bookingTotal}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card/60 p-3.5 text-center space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Pre-Booking Inquiry
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    This is an inquiry thread before rental confirmation. Once booked, delivery tracking and order logistics will link automatically.
                  </p>
                </div>
              )}

              {/* Live Delivery Status Widget */}
              {activeConversation.deliveryStatus && activeConversation.bookingId && (
                <div className="rounded-2xl border border-border bg-card p-3.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Delivery Tracking
                    </span>
                    {deliveryBadge && (
                      <span
                        className={cn(
                          "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border",
                          deliveryBadge.color,
                        )}
                      >
                        {deliveryBadge.label}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {activeConversation.deliveryEtaMinutes
                          ? `ETA: ~${activeConversation.deliveryEtaMinutes} mins`
                          : "Live Route Active"}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        navigate({
                          to: `/delivery/${activeConversation.bookingId}`,
                        })
                      }
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Track</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Safety Safeguard */}
              <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Payent Protection</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  Always keep payments and communication inside Payent to ensure deposit security and identity verification.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Image Modal */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Enlarged message photo"
              className="max-h-[80vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
