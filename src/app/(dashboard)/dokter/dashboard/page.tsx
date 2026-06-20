"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Calendar, Activity, ClipboardList, PawPrint } from "lucide-react";

export default function DokterDashboardPage() {
  const [stats, setStats] = useState({ appointment: 0, rawatInap: 0, rekamMedis: 0, pasien: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/inpatients").then((r) => r.json()),
      fetch("/api/medical-records").then((r) => r.json()),
      fetch("/api/pets").then((r) => r.json()),
    ])
      .then(([appt, inpat, medrec, pets]) => {
        setStats({
          appointment: appt.data?.length || 0,
          rawatInap: inpat.data?.length || 0,
          rekamMedis: medrec.data?.length || 0,
          pasien: pets.data?.length || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang, Dokter" />

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Appointment" value={`${stats.appointment} hari ini`} icon={Calendar} color="bg-sky-100 text-sky-600" />
        <Card title="Rawat Inap" value={`${stats.rawatInap} aktif`} icon={Activity} color="bg-violet-100 text-violet-600" />
        <Card title="Rekam Medis" value={`${stats.rekamMedis} bulan ini`} icon={ClipboardList} color="bg-emerald-100 text-emerald-600" />
        <Card title="Pasien" value={`${stats.pasien} bulan ini`} icon={PawPrint} color="bg-amber-100 text-amber-600" />
      </div>
    </div>
  );
}