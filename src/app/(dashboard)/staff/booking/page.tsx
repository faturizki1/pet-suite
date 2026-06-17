"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function StaffBookingPage() {
  return (
    <div>
      <PageHeader title="Booking Online" subtitle="Konfirmasi booking dari pelanggan" />
      <p className="text-sm text-slate-500">Daftar booking akan ditampilkan di sini.</p>
    </div>
  );
}