import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

let _globalUnreadCount = 0;
let _lastUnreadFetchTime = 0;
let _inFlightUnreadPromise: Promise<number> | null = null;
let _activeInterval: ReturnType<typeof setInterval> | null = null;
const _unreadListeners = new Set<(count: number) => void>();

function setGlobalUnreadCount(count: number) {
  _globalUnreadCount = count;
  _unreadListeners.forEach((l) => l(count));
}

async function triggerUnreadFetch(token: string | null): Promise<number> {
  if (!token) {
    setGlobalUnreadCount(0);
    return 0;
  }
  const now = Date.now();
  if (_inFlightUnreadPromise) {
    return _inFlightUnreadPromise;
  }
  if (now - _lastUnreadFetchTime < 15000) {
    return _globalUnreadCount;
  }

  _inFlightUnreadPromise = (async () => {
    try {
      const res = await api.getUnreadMessagesCount(token);
      const count = typeof res?.unreadCount === "number" ? res.unreadCount : (typeof res === "number" ? res : 0);
      setGlobalUnreadCount(count);
      _lastUnreadFetchTime = Date.now();
      return count;
    } catch {
      return _globalUnreadCount;
    } finally {
      _inFlightUnreadPromise = null;
    }
  })();

  return _inFlightUnreadPromise;
}

function ensureGlobalPolling(token: string | null) {
  if (_unreadListeners.size > 0 && !_activeInterval && token) {
    _activeInterval = setInterval(() => {
      const currentToken = storage.get<string | null>(STORAGE_KEYS.token, null);
      if (document.visibilityState === "visible") {
        triggerUnreadFetch(currentToken);
      }
    }, 60000);
  } else if ((_unreadListeners.size === 0 || !token) && _activeInterval) {
    clearInterval(_activeInterval);
    _activeInterval = null;
  }
}

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(() => _globalUnreadCount);
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);

  const fetchUnread = useCallback(() => {
    return triggerUnreadFetch(token);
  }, [token]);

  useEffect(() => {
    _unreadListeners.add(setUnreadCount);
    fetchUnread();
    ensureGlobalPolling(token);

    const handleCustomUpdate = () => {
      _lastUnreadFetchTime = 0; // force fresh fetch
      fetchUnread();
    };

    const handleFocus = () => {
      if (Date.now() - _lastUnreadFetchTime > 15000) {
        fetchUnread();
      }
    };

    window.addEventListener("payent:unread-messages-updated", handleCustomUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      _unreadListeners.delete(setUnreadCount);
      ensureGlobalPolling(token);
      window.removeEventListener("payent:unread-messages-updated", handleCustomUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUnread, token]);

  return { unreadCount, refreshUnreadCount: fetchUnread };
}
