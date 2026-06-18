"use client";

import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils/format";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";

interface SummaryData {
  total_pemasukan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  total_transaksi: number;
}

export function SummaryCards({ data }: { data: SummaryData | null }) {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card
        title="Pemasukan"
        value={formatRupiah(data?.total_pemasukan || 0)}
        icon={TrendingUp}
        color="bg-emerald-100 text-emerald-600"
      />
      <Card
        title="Pengeluaran"
        value={formatRupiah(data?.total_pengeluaran || 0)}
        icon={TrendingDown}
        color="bg-red-100 text-red-600"
      />
      <Card
        title="Laba Bersih"
        value={formatRupiah(data?.laba_bersih || 0)}
        icon={DollarSign}
        color="bg-sky-100 text-sky-600"
      />
      <Card
        title="Transaksi"
        value={`${data?.total_transaksi || 0} transaksi`}
        icon={Receipt}
        color="bg-violet-100 text-violet-600"
      />
    </div>
  );
}