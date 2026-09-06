import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

export function useWishlist() {
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token) {
      setIds([]);
      return;
    }
    api
      .getWishlist(token)
      .then((serverIds) => {
        setIds(serverIds || []);
      })
      .catch((err) => console.error("Failed to load backend wishlist:", err));
  }, [token]);

  const toggle = useCallback(
    (id: string) => {
      if (!token) return;
      // Optimistic state update
      setIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );

      api
        .toggleWishlist(token, id)
        .then((data) => {
          if (Array.isArray(data?.wishlist)) {
            setIds(data.wishlist);
          }
        })
        .catch((err) => {
          console.error("Failed to toggle wishlist item on server:", err);
          api.getWishlist(token).then((serverIds) => {
            setIds(serverIds || []);
          });
        });
    },
    [token],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
