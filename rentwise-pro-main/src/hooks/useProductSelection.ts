import { useState, useEffect } from "react";

type SelectionListener = (id: string | null) => void;
const listeners = new Set<SelectionListener>();
let selectedProductId: string | null = null;

export function useProductSelection() {
  const [selectedId, setSelectedId] = useState<string | null>(selectedProductId);

  useEffect(() => {
    const handleUpdate = (id: string | null) => {
      setSelectedId(id);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const selectProduct = (id: string | null) => {
    selectedProductId = id;
    listeners.forEach((listener) => listener(id));
  };

  return {
    selectedId,
    selectProduct,
    isSelected: (id: string) => selectedId === id,
  };
}
