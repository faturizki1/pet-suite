"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function DokterRawatInapPage() {
  return (
    <div>
      <PageHeader title="Rawat Inap" subtitle="Pasien rawat inap aktif" />
      <p className="text-sm text-slate-500">Daftar pasien rawat inap akan ditampilkan di sini.</p>
    </div>
  );
}