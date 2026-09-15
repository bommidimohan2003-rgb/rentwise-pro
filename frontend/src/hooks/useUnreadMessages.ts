import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);

  const fetchUnread = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }
    try {
      const count = await api.getUnreadMessagesCount(token);
      setUnreadCount(count || 0);
    } catch {
      // Silently fail if unauthenticated or network error
    }
  }, [token]);

  useEffect(() => {
    fetchUnread();

    // Poll every 15 seconds
    const interval = setInterval(fetchUnread, 15000);

    // Also listen to custom unread update event
    const handleCustomUpdate = () => {
      fetchUnread();
    };
    window.addEventListener("payent:unread-messages-updated", handleCustomUpdate);
    window.addEventListener("focus", fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener("payent:unread-messages-updated", handleCustomUpdate);
      window.removeEventListener("focus", fetchUnread);
    };
  }, [fetchUnread]);

  return { unreadCount, refreshUnreadCount: fetchUnread };
}
