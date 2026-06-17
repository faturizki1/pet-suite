"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PawPrint, ClipboardList, Activity } from "lucide-react";

export default function CustomerDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang" />
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Hewan Saya" value="0" icon={PawPrint} color="bg-sky-100 text-sky-600" />
        <Card title="Rekam Medis" value="0" icon={ClipboardList} color="bg-violet-100 text-violet-600" />
        <Card title="Monitoring" value="0" icon={Activity} color="bg-emerald-100 text-emerald-600" />
      </div>
    </div>
  );
}