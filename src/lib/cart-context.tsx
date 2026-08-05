"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const MAX_QTY = 10;
const STORAGE_KEY = "daigou-cart";

export type CartItem = {
  key: string; // productSlug__variantId
  productSlug: string;
  productTitle: string;
  variantId: string;
  optionLabel: string;
  unitPrice: number;
  quantity: number;
  gradient: [string, string];
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  addItem: (item: Omit<CartItem, "key" | "quantity">, qty: number) => void;
  setQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // 初次載入從 localStorage 還原
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // 忽略毀損資料
    }
    setReady(true);
  }, []);

  // 變動時寫回
  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, "key" | "quantity">, qty: number) => {
      const key = `${item.productSlug}__${item.variantId}`;
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key);
        if (existing) {
          return prev.map((i) =>
            i.key === key
              ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + qty) }
              : i,
          );
        }
        return [...prev, { ...item, key, quantity: Math.min(MAX_QTY, qty) }];
      });
    },
    [],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, qty)) } : i,
      ),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { items, count, subtotal, ready, addItem, setQty, removeItem, clear };
  }, [items, ready, addItem, setQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart 必須在 CartProvider 內使用");
  return ctx;
}
