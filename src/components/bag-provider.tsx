"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SelectedNoteIds } from "@/lib/types";

export type BagItem = {
  id: string;
  perfumeName: string;
  selectedNoteIds: SelectedNoteIds;
  noteNames: { top: string[]; middle: string[]; base: string[] };
  bottleSizeId: string;
  bottleSizeName: string;
  scentStrengthId: string;
  scentStrengthName: string;
  specialInstructions: string;
  estimatedPrice: number;
};

type BagContextValue = {
  items: BagItem[];
  addItem: (item: Omit<BagItem, "id">) => void;
  removeItem: (id: string) => void;
  clearBag: () => void;
};

const BagContext = createContext<BagContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearBag: () => {}
});

const storageKey = "north-allen-bag";

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) setItems(JSON.parse(stored) as BagItem[]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const value = useMemo<BagContextValue>(() => ({
    items,
    addItem: (item) => setItems((current) => [...current, { ...item, id: crypto.randomUUID() }]),
    removeItem: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    clearBag: () => setItems([])
  }), [items]);

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag() {
  return useContext(BagContext);
}
