"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function DokterAppointmentPage() {
  return (
    <div>
      <PageHeader title="Appointment Saya" subtitle="Jadwal appointment hari ini" />
      <p className="text-sm text-slate-500">Daftar appointment akan ditampilkan di sini.</p>
    </div>
  );
}