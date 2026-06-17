"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function CustomerHewanPage() {
  return (
    <div>
      <PageHeader title="Hewan Saya" subtitle="Data hewan peliharaan Anda" />
      <p className="text-sm text-slate-500">Daftar hewan akan ditampilkan di sini.</p>
    </div>
  );
}