"use client";

import { useState, useEffect, useCallback } from "react";

export interface CatalogItem {
  id: string;
  nama: string;
  hargaJual?: string;
  harga?: string;
  stok?: number;
  kodeProduk?: string;
  category?: { id: string; nama: string } | null;
}

export interface CartItem {
  id: string;
  tipe_item: "produk" | "layanan";
  nama: string;
  harga: number;
  qty: number;
  diskon: number;
}

export function usePos() {
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

  const addToCart = useCallback((item: CatalogItem, tipe: "produk" | "layanan") => {
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
  }, []);

  const updateQty = useCallback((id: string, tipe: "produk" | "layanan", delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id && c.tipe_item === tipe ? { ...c, qty: Math.max(1, c.qty + delta) } : c
        )
        .filter((c) => c.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: string, tipe: "produk" | "layanan") => {
    setCart((prev) => prev.filter((c) => !(c.id === id && c.tipe_item === tipe)));
  }, []);

  const resetCart = useCallback(() => {
    setCart([]);
    setDiskon(0);
    setUangDiterima("");
    setShowPayment(false);
    setError("");
  }, []);

  const subtotal = cart.reduce((sum, c) => sum + c.harga * c.qty - c.diskon, 0);
  const total = subtotal - diskon;
  const kembalian = metodeBayar === "tunai" ? Number(uangDiterima || 0) - total : 0;

  const submitTransaction = useCallback(async () => {
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
        return null;
      }
      resetCart();
      return json.data;
    } catch {
      setError("Terjadi kesalahan");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [cart, metodeBayar, diskon, uangDiterima, resetCart]);

  return {
    products,
    services,
    cart,
    search,
    loading,
    submitting,
    showPayment,
    metodeBayar,
    uangDiterima,
    diskon,
    error,
    filteredProducts,
    filteredServices,
    subtotal,
    total,
    kembalian,
    setSearch,
    setShowPayment,
    setMetodeBayar,
    setUangDiterima,
    setDiskon,
    addToCart,
    updateQty,
    removeFromCart,
    submitTransaction,
    resetCart,
  };
}