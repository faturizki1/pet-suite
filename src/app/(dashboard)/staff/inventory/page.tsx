"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Table } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatRupiah, formatDate } from "@/lib/utils/format";
import { Plus, Search, Package } from "lucide-react";

interface Product {
  id: string;
  kodeProduk: string;
  nama: string;
  hargaBeli: string;
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
  const [stockQty, setStockQty] = useState(0);
  const [stockNote, setStockNote] = useState("");
  const [form, setForm] = useState({ kode_produk: "", nama: "", harga_jual: 0, stok: 0, stok_minimum: 5, satuan: "pcs" });

  useEffect(() => {
    fetch("/api/inventory/products")
      .then((r) => r.json())
      .then((j) => setProducts(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    const res = await fetch("/api/inventory/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const json = await res.json();
      setProducts((prev) => [json.data, ...prev]);
      setShowAdd(false);
      setForm({ kode_produk: "", nama: "", harga_jual: 0, stok: 0, stok_minimum: 5, satuan: "pcs" });
    }
  }

  async function handleStockIn() {
    if (!showStock || stockQty <= 0) return;
    const res = await fetch(`/api/inventory/products/${showStock.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipe: "masuk", qty: stockQty, catatan: stockNote }),
    });
    if (res.ok) {
      const json = await res.json();
      setProducts((prev) =>
        prev.map((p) =>
          p.id === showStock.id ? { ...p, stok: json.data.product.stok } : p
        )
      );
      setShowStock(null);
      setStockQty(0);
      setStockNote("");
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

      <Table
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

      {/* Add Product Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Produk">
        <div className="space-y-4">
          <Input label="Kode Produk *" value={form.kode_produk} onChange={(e) => setForm({ ...form, kode_produk: e.target.value })} />
          <Input label="Nama *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          <Input label="Harga Jual *" type="number" value={form.harga_jual} onChange={(e) => setForm({ ...form, harga_jual: Number(e.target.value) })} />
          <Input label="Stok Awal" type="number" value={form.stok} onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })} />
          <Input label="Stok Minimum" type="number" value={form.stok_minimum} onChange={(e) => setForm({ ...form, stok_minimum: Number(e.target.value) })} />
          <Button className="w-full" onClick={handleAdd}>Simpan</Button>
        </div>
      </Modal>

      {/* Stock In Modal */}
      <Modal
        open={!!showStock}
        onClose={() => setShowStock(null)}
        title={`Tambah Stok: ${showStock?.nama || ""}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Stok Saat Ini: <strong>{showStock?.stok}</strong></p>
          <Input label="Jumlah Masuk *" type="number" value={stockQty} onChange={(e) => setStockQty(Number(e.target.value))} />
          <Input label="Catatan" value={stockNote} onChange={(e) => setStockNote(e.target.value)} />
          <Button className="w-full" onClick={handleStockIn} disabled={stockQty <= 0}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}