"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function HewanPage() {
  return (
    <div>
      <PageHeader title="Semua Hewan" subtitle="Data hewan terdaftar di klinik" />
      <p className="text-sm text-slate-500">Daftar hewan akan ditampilkan di sini.</p>
    </div>
  );
}