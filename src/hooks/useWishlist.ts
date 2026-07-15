import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/utils/storage";
import { api } from "@/utils/api";

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);
  const token = storage.get<string | null>(STORAGE_KEYS.token, null);

  useEffect(() => {
    if (!token) {
      setIds([]);
      return;
    }
    api
      .getWishlist(token)
      .then(setIds)
      .catch((err) => console.error("Failed to load wishlist:", err));
  }, [token]);

  const toggle = useCallback(
    (id: string) => {
      if (!token) return;
      api
        .toggleWishlist(token, id)
        .then(() => {
          setIds((prev) => {
            return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
          });
        })
        .catch((err) => console.error("Failed to toggle wishlist item:", err));
    },
    [token],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
