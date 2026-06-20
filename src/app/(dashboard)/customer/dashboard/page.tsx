"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PawPrint, ClipboardList, Activity } from "lucide-react";

export default function CustomerDashboardPage() {
  const [stats, setStats] = useState({ hewan: 0, rekamMedis: 0, monitoring: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pets").then((r) => r.json()),
      fetch("/api/medical-records").then((r) => r.json()),
      fetch("/api/inpatients").then((r) => r.json()),
    ])
      .then(([pets, medrec, inpat]) => {
        setStats({
          hewan: pets.data?.length || 0,
          rekamMedis: medrec.data?.length || 0,
          monitoring: inpat.data?.filter((i: { status: string }) => i.status === "aktif").length || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang" />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card title="Hewan Saya" value={`${stats.hewan} ekor`} icon={PawPrint} color="bg-sky-100 text-sky-600" />
        <Card title="Rekam Medis" value={`${stats.rekamMedis} catatan`} icon={ClipboardList} color="bg-emerald-100 text-emerald-600" />
        <Card title="Monitoring" value={`${stats.monitoring} aktif`} icon={Activity} color="bg-violet-100 text-violet-600" />
      </div>
    </div>
  );
}