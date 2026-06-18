"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatRupiah } from "@/lib/utils/format";
import { Search } from "lucide-react";
import { ProductForm } from "@/components/modules/inventory/product-form";
import { StockMutationForm } from "@/components/modules/inventory/stock-mutation-form";

interface Product {
  id: string;
  kodeProduk: string;
  nama: string;
  hargaJual: string;
  stok: number;
  stokMinimum: number;
  satuan: string;
  isActive: boolean;
  category?: { id: string; nama: string } | null;
}

export default function StaffInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showStock, setShowStock] = useState<{ id: string; nama: string; stok: number } | null>(null);

  useEffect(() => {
    fetch("/api/inventory/products")
      .then((r) => r.json())
      .then((j) => setProducts(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(data: { kode_produk: string; nama: string; harga_jual: number; stok: number; stok_minimum: number; satuan: string }) {
    const res = await fetch("/api/inventory/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      setProducts((prev) => [json.data, ...prev]);
      setShowAdd(false);
    }
  }

  async function handleStockIn(qty: number, catatan: string) {
    if (!showStock) return;
    const res = await fetch(`/api/inventory/products/${showStock.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipe: "masuk", qty, catatan }),
    });
    if (res.ok) {
      const json = await res.json();
      setProducts((prev) =>
        prev.map((p) =>
          p.id === showStock.id ? { ...p, stok: json.data.product.stok } : p
        )
      );
      setShowStock(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Kelola produk dan stok"
        action={{ label: "Tambah Produk", onClick: () => setShowAdd(true) }}
      />

      <div className="mb-4">
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
        />
      </div>

      <Table<Product>
        columns={[
          { key: "kodeProduk", header: "Kode" },
          { key: "nama", header: "Nama" },
          { key: "hargaJual", header: "Harga Jual", render: (p) => formatRupiah(p.hargaJual) },
          {
            key: "stok",
            header: "Stok",
            render: (p) => (
              <span className={p.stok < p.stokMinimum ? "font-bold text-red-600" : ""}>
                {p.stok} {p.satuan}
              </span>
            ),
          },
          { key: "stokMinimum", header: "Min Stok" },
          {
            key: "isActive",
            header: "Status",
            render: (p) => <Badge status={p.isActive ? "aktif" : "batal"} />,
          },
          {
            key: "aksi",
            header: "Aksi",
            render: (p) => (
              <Button size="sm" variant="outline" onClick={() => setShowStock({ id: p.id, nama: p.nama, stok: p.stok })}>
                + Stok
              </Button>
            ),
          },
        ]}
        data={filtered}
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Produk">
        <ProductForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal
        open={!!showStock}
        onClose={() => setShowStock(null)}
        title={`Tambah Stok: ${showStock?.nama || ""}`}
      >
        {showStock && (
          <StockMutationForm
            productName={showStock.nama}
            currentStock={showStock.stok}
            onSubmit={handleStockIn}
            onCancel={() => setShowStock(null)}
          />
        )}
      </Modal>
    </div>
  );
}