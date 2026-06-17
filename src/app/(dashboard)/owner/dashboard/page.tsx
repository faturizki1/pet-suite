"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { formatRupiah } from "@/lib/utils/format";

export default function OwnerDashboard() {
  const [data, setData] = useState<{
    total_pemasukan: number;
    total_pengeluaran: number;
    laba_bersih: number;
    total_transaksi: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/summary")
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang di panel owner" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Pemasukan" value={formatRupiah(data?.total_pemasukan || 0)} icon={TrendingUp} color="bg-emerald-100 text-emerald-600" />
        <Card title="Pengeluaran" value={formatRupiah(data?.total_pengeluaran || 0)} icon={TrendingDown} color="bg-red-100 text-red-600" />
        <Card title="Laba Bersih" value={formatRupiah(data?.laba_bersih || 0)} icon={DollarSign} color="bg-sky-100 text-sky-600" />
        <Card title="Transaksi" value={`${data?.total_transaksi || 0} transaksi`} icon={Receipt} color="bg-violet-100 text-violet-600" />
      </div>
    </div>
  );
}