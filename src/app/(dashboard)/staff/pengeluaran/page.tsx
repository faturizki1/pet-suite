"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function StaffPengeluaranPage() {
  return (
    <div>
      <PageHeader title="Pengeluaran" subtitle="Catat pengeluaran klinik" />
      <p className="text-sm text-slate-500">Daftar pengeluaran akan ditampilkan di sini.</p>
    </div>
  );
}