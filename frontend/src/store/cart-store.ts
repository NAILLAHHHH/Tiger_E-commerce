"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { lineTotal, roundMoney } from "@/lib/pricing";
import type { CartItem } from "@/types/database";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const normalized: CartItem = {
          ...item,
          unitPrice: roundMoney(item.unitPrice),
        };
        const existing = get().items.find(
          (i) => i.variantId === normalized.variantId,
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === normalized.variantId
                ? { ...i, quantity: i.quantity + normalized.quantity }
                : i,
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...get().items, normalized], isOpen: true });
        }
      },
      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
    }),
    { name: "tiger-cart" },
  ),
);

export function selectCartTotal(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + lineTotal(item.unitPrice, item.quantity),
    0,
  );
}

export function selectCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
