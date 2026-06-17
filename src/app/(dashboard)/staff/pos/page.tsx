"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

interface CatalogItem {
  id: string;
  nama: string;
  hargaJual?: string;
  harga?: string;
  stok?: number;
  kodeProduk?: string;
  category?: { id: string; nama: string } | null;
}

interface CartItem {
  id: string;
  tipe_item: "produk" | "layanan";
  nama: string;
  harga: number;
  qty: number;
  diskon: number;
}

export default function StaffPOSPage() {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [metodeBayar, setMetodeBayar] = useState("tunai");
  const [uangDiterima, setUangDiterima] = useState("");
  const [diskon, setDiskon] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pos/catalog")
      .then((res) => res.json())
      .then((json) => {
        setProducts(json.data?.products || []);
        setServices(json.data?.services || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  );
  const filteredServices = services.filter((s) =>
    s.nama.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(item: CatalogItem, tipe: "produk" | "layanan") {
    const harga = tipe === "produk" ? Number(item.hargaJual || 0) : Number(item.harga || 0);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id && c.tipe_item === tipe);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id && c.tipe_item === tipe ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { id: item.id, tipe_item: tipe, nama: item.nama, harga, qty: 1, diskon: 0 }];
    });
  }

  function updateQty(id: string, tipe: "produk" | "layanan", delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id && c.tipe_item === tipe ? { ...c, qty: Math.max(1, c.qty + delta) } : c
        )
        .filter((c) => c.qty > 0)
    );
  }

  function removeFromCart(id: string, tipe: "produk" | "layanan") {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.tipe_item === tipe)));
  }

  const subtotal = cart.reduce((sum, c) => sum + c.harga * c.qty - c.diskon, 0);
  const total = subtotal - diskon;
  const kembalian = metodeBayar === "tunai" ? Number(uangDiterima || 0) - total : 0;

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/pos/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({
            tipe_item: c.tipe_item,
            product_id: c.tipe_item === "produk" ? c.id : undefined,
            service_id: c.tipe_item === "layanan" ? c.id : undefined,
            qty: c.qty,
            diskon: c.diskon,
          })),
          metode_bayar: metodeBayar,
          diskon_nominal: diskon,
          uang_diterima: metodeBayar === "tunai" ? Number(uangDiterima) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Transaksi gagal");
        return;
      }
      setCart([]);
      setDiskon(0);
      setUangDiterima("");
      setShowPayment(false);
      alert(`Transaksi berhasil!\nNo: ${json.data.noTransaksi}`);
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="POS Kasir" subtitle="Point of Sale" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <Input
            placeholder="Cari produk atau layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />

          {/* Products */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Produk</h3>
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada produk</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p, "produk")}
                    disabled={p.stok !== undefined && p.stok <= 0}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-slate-900 truncate">{p.nama}</p>
                    <p className="text-sky-600 font-semibold">{formatRupiah(p.hargaJual || "0")}</p>
                    {p.stok !== undefined && (
                      <p className="text-xs text-slate-400">Stok: {p.stok}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Layanan</h3>
            {filteredServices.length === 0 ? (
              <p className="text-sm text-slate-400">Tidak ada layanan</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addToCart(s, "layanan")}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:border-violet-300 hover:bg-violet-50"
                  >
                    <p className="font-medium text-slate-900 truncate">{s.nama}</p>
                    <p className="text-violet-600 font-semibold">{formatRupiah(s.harga || "0")}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <ShoppingCart className="h-5 w-5 text-sky-500" />
            <h3 className="font-semibold text-slate-900">Keranjang</h3>
            <span className="ml-auto text-sm text-slate-400">{cart.length} item</span>
          </div>

          {cart.length === 0 ? (
            <EmptyState title="Keranjang kosong" description="Pilih produk atau layanan" />
          ) : (
            <div className="mt-3 space-y-2">
              {cart.map((c) => (
                <div key={`${c.tipe_item}-${c.id}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.nama}</p>
                    <p className="text-xs text-slate-500">{formatRupiah(c.harga)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(c.id, c.tipe_item, -1)} className="rounded p-1 hover:bg-slate-200">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{c.qty}</span>
                    <button onClick={() => updateQty(c.id, c.tipe_item, 1)} className="rounded p-1 hover:bg-slate-200">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => removeFromCart(c.id, c.tipe_item)} className="ml-1 rounded p-1 text-red-500 hover:bg-red-50">
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
                    onChange={(e) => setDiskon(Number(e.target.value) || 0)}
                    className="w-20 rounded border border-slate-200 px-2 py-0.5 text-right text-sm"
                  />
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-sky-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <Button className="w-full mt-3" onClick={() => setShowPayment(true)}>
                Bayar ({formatRupiah(total)})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Pembayaran">
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-sky-600">{formatRupiah(total)}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
              Metode Bayar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["tunai", "transfer", "qris", "debit"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMetodeBayar(m)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    metodeBayar === m
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {metodeBayar === "tunai" && (
            <Input
              label="Uang Diterima"
              type="number"
              value={uangDiterima}
              onChange={(e) => setUangDiterima(e.target.value)}
              placeholder="0"
            />
          )}

          {metodeBayar === "tunai" && Number(uangDiterima) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Kembalian</span>
              <span className="font-semibold text-emerald-600">
                {formatRupiah(Math.max(0, kembalian))}
              </span>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full"
            onClick={handleSubmit}
            loading={submitting}
            disabled={metodeBayar === "tunai" && Number(uangDiterima) < total}
          >
            Konfirmasi Pembayaran
          </Button>
        </div>
      </Modal>
    </div>
  );
}