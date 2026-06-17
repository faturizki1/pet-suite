"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function DokterRekamMedisPage() {
  return (
    <div>
      <PageHeader title="Rekam Medis" subtitle="Input dan lihat rekam medis" />
      <p className="text-sm text-slate-500">Daftar rekam medis akan ditampilkan di sini.</p>
    </div>
  );
}