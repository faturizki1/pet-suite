"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function StaffAppointmentPage() {
  return (
    <div>
      <PageHeader title="Appointment" subtitle="Kelola appointment" />
      <p className="text-sm text-slate-500">Daftar appointment akan ditampilkan di sini.</p>
    </div>
  );
}