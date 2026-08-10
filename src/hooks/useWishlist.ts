import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

export function useWishlist() {
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);
  const [ids, setIds] = useState<string[]>(() => {
    return storage.get<string[]>(STORAGE_KEYS.wishlist, []);
  });

  useEffect(() => {
    if (!token) return;
    api
      .getWishlist(token)
      .then((serverIds) => {
        if (Array.isArray(serverIds)) {
          setIds(serverIds);
          storage.set(STORAGE_KEYS.wishlist, serverIds);
        }
      })
      .catch((err) => console.warn("Notice loading backend wishlist:", err));
  }, [token]);

  const toggle = useCallback(
    (id: string) => {
      // Optimistic UI update
      setIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        storage.set(STORAGE_KEYS.wishlist, next);
        return next;
      });

      if (token) {
        api.toggleWishlist(token, id).catch((err) => {
          console.warn("Notice toggling wishlist item on server:", err);
        });
      }
    },
    [token],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
