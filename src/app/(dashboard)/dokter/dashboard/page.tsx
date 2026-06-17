"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Calendar, Bed, ClipboardList, PawPrint } from "lucide-react";

export default function DokterDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang, Dokter" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Appointment Hari Ini" value="0" icon={Calendar} color="bg-sky-100 text-sky-600" />
        <Card title="Rawat Inap Aktif" value="0" icon={Bed} color="bg-violet-100 text-violet-600" />
        <Card title="Rekam Medis Bulan Ini" value="0" icon={ClipboardList} color="bg-emerald-100 text-emerald-600" />
        <Card title="Pasien Bulan Ini" value="0" icon={PawPrint} color="bg-amber-100 text-amber-600" />
      </div>
    </div>
  );
}