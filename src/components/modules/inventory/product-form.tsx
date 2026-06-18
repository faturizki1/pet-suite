"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProductFormData {
  kode_produk: string;
  nama: string;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
  satuan: string;
}

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ onSubmit, onCancel }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    kode_produk: "",
    nama: "",
    harga_jual: 0,
    stok: 0,
    stok_minimum: 5,
    satuan: "pcs",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="Kode Produk *"
        value={form.kode_produk}
        onChange={(e) => setForm({ ...form, kode_produk: e.target.value })}
      />
      <Input
        label="Nama *"
        value={form.nama}
        onChange={(e) => setForm({ ...form, nama: e.target.value })}
      />
      <Input
        label="Harga Jual *"
        type="number"
        value={form.harga_jual}
        onChange={(e) => setForm({ ...form, harga_jual: Number(e.target.value) })}
      />
      <Input
        label="Stok Awal"
        type="number"
        value={form.stok}
        onChange={(e) => setForm({ ...form, stok: Number(e.target.value) })}
      />
      <Input
        label="Stok Minimum"
        type="number"
        value={form.stok_minimum}
        onChange={(e) => setForm({ ...form, stok_minimum: Number(e.target.value) })}
      />
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSubmit} loading={submitting}>
          Simpan
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}