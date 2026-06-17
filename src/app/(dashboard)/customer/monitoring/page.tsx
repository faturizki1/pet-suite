"use client";

import { PageHeader } from "@/components/ui/page-header";

export default function CustomerMonitoringPage() {
  return (
    <div>
      <PageHeader title="Monitoring" subtitle="Pantau kondisi hewan rawat inap" />
      <p className="text-sm text-slate-500">Status monitoring hewan akan ditampilkan di sini.</p>
    </div>
  );
}