"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils/format";
import type { CatalogItem } from "@/hooks/use-pos";

interface CatalogGridProps {
  products: CatalogItem[];
  services: CatalogItem[];
  search: string;
  onSearchChange: (s: string) => void;
  onAddToCart: (item: CatalogItem, tipe: "produk" | "layanan") => void;
}

export function CatalogGrid({
  products,
  services,
  search,
  onSearchChange,
  onAddToCart,
}: CatalogGridProps) {
  const filteredProducts = products.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  );
  const filteredServices = services.filter((s) =>
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Cari produk atau layanan..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        icon={<Search className="h-4 w-4" />}
      />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Produk</h3>
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada produk</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => onAddToCart(p, "produk")}
                disabled={p.stok !== undefined && p.stok <= 0}
                className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-slate-900 truncate">{p.nama}</p>
                <p className="text-sky-600 font-semibold">
                  {formatRupiah(p.hargaJual || "0")}
                </p>
                {p.stok !== undefined && (
                  <p className="text-xs text-slate-400">Stok: {p.stok}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Layanan</h3>
        {filteredServices.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada layanan</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredServices.map((s) => (
              <button
                key={s.id}
                onClick={() => onAddToCart(s, "layanan")}
                className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:border-violet-300 hover:bg-violet-50"
              >
                <p className="font-medium text-slate-900 truncate">{s.nama}</p>
                <p className="text-violet-600 font-semibold">
                  {formatRupiah(s.harga || "0")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}