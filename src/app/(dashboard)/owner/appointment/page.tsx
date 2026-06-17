"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function OwnerAppointmentPage() {
  return (
    <div>
      <PageHeader title="Appointment" subtitle="Kelola semua appointment" />
      <p className="text-sm text-slate-500">Daftar appointment akan ditampilkan di sini.</p>
    </div>
  );
}