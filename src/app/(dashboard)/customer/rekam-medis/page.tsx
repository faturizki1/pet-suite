"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function CustomerRekamMedisPage() {
  return (
    <div>
      <PageHeader title="Rekam Medis" subtitle="Riwayat kesehatan hewan Anda" />
      <p className="text-sm text-slate-500">Daftar rekam medis akan ditampilkan di sini.</p>
    </div>
  );
}