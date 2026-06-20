"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatRupiah } from "@/lib/utils/format";
import { TrendingUp, TrendingDown, DollarSign, Receipt, Users, Calendar, Activity } from "lucide-react";

interface SummaryData {
  total_pemasukan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  total_transaksi: number;
}

export default function OwnerDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports/summary").then((r) => r.json()),
      fetch("/api/reports/summary?tgl_dari=" + new Date().toISOString().slice(0, 10)).then((r) => r.json()),
    ])
      .then(([all, today]) => {
        setSummary(all.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang, Owner" />

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Pemasukan"
          value={formatRupiah(summary?.total_pemasukan || 0)}
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-600"
        />
        <Card
          title="Pengeluaran"
          value={formatRupiah(summary?.total_pengeluaran || 0)}
          icon={TrendingDown}
          color="bg-red-100 text-red-600"
        />
        <Card
          title="Laba Bersih"
          value={formatRupiah(summary?.laba_bersih || 0)}
          icon={DollarSign}
          color="bg-sky-100 text-sky-600"
        />
        <Card
          title="Transaksi"
          value={`${summary?.total_transaksi || 0} transaksi`}
          icon={Receipt}
          color="bg-violet-100 text-violet-600"
        />
      </div>
    </div>
  );
}