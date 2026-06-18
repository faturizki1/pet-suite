"use client";

import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah } from "@/lib/utils/format";
import type { CartItem } from "@/hooks/use-pos";

interface CartProps {
  items: CartItem[];
  subtotal: number;
  diskon: number;
  total: number;
  onUpdateQty: (id: string, tipe: "produk" | "layanan", delta: number) => void;
  onRemove: (id: string, tipe: "produk" | "layanan") => void;
  onDiskonChange: (d: number) => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  subtotal,
  diskon,
  total,
  onUpdateQty,
  onRemove,
  onDiskonChange,
  onCheckout,
}: CartProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <ShoppingCart className="h-5 w-5 text-sky-500" />
        <h3 className="font-semibold text-slate-900">Keranjang</h3>
        <span className="ml-auto text-sm text-slate-400">{items.length} item</span>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Keranjang kosong" description="Pilih produk atau layanan" />
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((c) => (
            <div
              key={`${c.tipe_item}-${c.id}`}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{c.nama}</p>
                <p className="text-xs text-slate-500">{formatRupiah(c.harga)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQty(c.id, c.tipe_item, -1)}
                  className="rounded p-1 hover:bg-slate-200"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-medium">{c.qty}</span>
                <button
                  onClick={() => onUpdateQty(c.id, c.tipe_item, 1)}
                  className="rounded p-1 hover:bg-slate-200"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onRemove(c.id, c.tipe_item)}
                  className="ml-1 rounded p-1 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          <div className="border-t border-slate-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Diskon</span>
              <input
                type="number"
                value={diskon}
                onChange={(e) => onDiskonChange(Number(e.target.value) || 0)}
                className="w-20 rounded border border-slate-200 px-2 py-0.5 text-right text-sm"
              />
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-sky-600">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button className="w-full mt-3" onClick={onCheckout}>
            Bayar ({formatRupiah(total)})
          </Button>
        </div>
      )}
    </div>
  );
}