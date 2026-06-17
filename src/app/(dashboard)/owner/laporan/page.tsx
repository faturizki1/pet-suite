"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function LaporanPage() {
  return (
    <div>
      <PageHeader title="Laporan Keuangan" subtitle="Ringkasan pemasukan dan pengeluaran" />
      <p className="text-sm text-slate-500">Fitur laporan lengkap tersedia di dashboard owner.</p>
    </div>
  );
}