"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function DokterHewanPage() {
  return (
    <div>
      <PageHeader title="Data Hewan" subtitle="Semua data hewan terdaftar" />
      <p className="text-sm text-slate-500">Daftar hewan akan ditampilkan di sini.</p>
    </div>
  );
}