import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

let _globalUnreadCount = 0;
const _unreadListeners = new Set<(count: number) => void>();

function setGlobalUnreadCount(count: number) {
  _globalUnreadCount = count;
  _unreadListeners.forEach((l) => l(count));
}

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return _globalUnreadCount;
  });
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);

  const fetchUnread = useCallback(async () => {
    if (!token) {
      setGlobalUnreadCount(0);
      return;
    }
    try {
      const res = await api.getUnreadMessagesCount(token);
      const count = typeof res?.unreadCount === "number" ? res.unreadCount : (typeof res === "number" ? res : 0);
      setGlobalUnreadCount(count);
    } catch {
      // Silently fail if unauthenticated or network error
    }
  }, [token]);

  useEffect(() => {
    _unreadListeners.add(setUnreadCount);
    fetchUnread();

    // Poll every 30 seconds for background sync
    const interval = setInterval(fetchUnread, 30000);

    // Also listen to custom unread update event
    const handleCustomUpdate = () => {
      fetchUnread();
    };
    window.addEventListener("payent:unread-messages-updated", handleCustomUpdate);
    window.addEventListener("focus", fetchUnread);

    return () => {
      _unreadListeners.delete(setUnreadCount);
      clearInterval(interval);
      window.removeEventListener("payent:unread-messages-updated", handleCustomUpdate);
      window.removeEventListener("focus", fetchUnread);
    };
  }, [fetchUnread]);

  return { unreadCount, refreshUnreadCount: fetchUnread };
}
