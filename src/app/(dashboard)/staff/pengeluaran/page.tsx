"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatRupiah, formatDate } from "@/lib/utils/format";

interface Expense {
  id: string;
  kategori: string;
  deskripsi: string;
  jumlah: string;
  tglPengeluaran: string;
  staff: { id: string; namaLengkap: string };
}

export default function StaffPengeluaranPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ kategori: "", deskripsi: "", jumlah: 0, tgl_pengeluaran: "" });

  function loadData() {
    setLoading(true);
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((j) => setExpenses(j.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd() {
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ kategori: "", deskripsi: "", jumlah: 0, tgl_pengeluaran: "" });
      loadData();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Pengeluaran"
        subtitle="Catat pengeluaran klinik"
        action={{ label: "Tambah Pengeluaran", onClick: () => setShowAdd(true) }}
      />

      <Table
        columns={[
          { key: "tglPengeluaran", header: "Tanggal", render: (e: Expense) => formatDate(e.tglPengeluaran) },
          { key: "kategori", header: "Kategori" },
          { key: "deskripsi", header: "Deskripsi" },
          { key: "jumlah", header: "Jumlah", render: (e: Expense) => formatRupiah(e.jumlah) },
          { key: "staff", header: "Dicatat oleh", render: (e: Expense) => e.staff.namaLengkap },
        ]}
        data={expenses}
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Pengeluaran">
        <div className="space-y-4">
          <Input label="Kategori *" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
          <Input label="Deskripsi *" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
          <Input label="Jumlah *" type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })} />
          <Input label="Tanggal *" type="date" value={form.tgl_pengeluaran} onChange={(e) => setForm({ ...form, tgl_pengeluaran: e.target.value })} />
          <Button className="w-full" onClick={handleAdd}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}