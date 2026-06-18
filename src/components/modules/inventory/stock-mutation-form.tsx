"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockMutationFormProps {
  productName: string;
  currentStock: number;
  onSubmit: (qty: number, catatan: string) => Promise<void>;
  onCancel: () => void;
}

export function StockMutationForm({
  productName,
  currentStock,
  onSubmit,
  onCancel,
}: StockMutationFormProps) {
  const [qty, setQty] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (qty <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit(qty, catatan);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Stok Saat Ini: <strong>{currentStock}</strong>
      </p>
      <Input
        label="Jumlah Masuk *"
        type="number"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
      />
      <Input
        label="Catatan"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={qty <= 0}
          loading={submitting}
        >
          Simpan
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}