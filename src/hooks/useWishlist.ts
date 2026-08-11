import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

export function useWishlist() {
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);
  const [ids, setIds] = useState<string[]>(() => {
    return token ? storage.get<string[]>(STORAGE_KEYS.wishlist, []) : [];
  });

  useEffect(() => {
    if (!token) {
      setIds([]);
      storage.remove(STORAGE_KEYS.wishlist);
      return;
    }
    api
      .getWishlist(token)
      .then((serverIds) => {
        setIds(serverIds);
        storage.set(STORAGE_KEYS.wishlist, serverIds);
      })
      .catch((err) => console.error("Failed to load backend wishlist:", err));
  }, [token]);

  const toggle = useCallback(
    (id: string) => {
      if (!token) return;
      // Optimistic UI update
      setIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        storage.set(STORAGE_KEYS.wishlist, next);
        return next;
      });

      api.toggleWishlist(token, id).catch((err) => {
        console.error("Failed to toggle wishlist item on server:", err);
        // Revert optimistic update on failure
        api.getWishlist(token).then((serverIds) => {
          setIds(serverIds);
          storage.set(STORAGE_KEYS.wishlist, serverIds);
        });
      });
    },
    [token],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
