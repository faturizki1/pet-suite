"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { formatRupiah, formatDate } from "@/lib/utils/format";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";

export default function LaporanPage() {
  const [tglDari, setTglDari] = useState("");
  const [tglSampai, setTglSampai] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (tglDari) params.set("tgl_dari", tglDari);
    if (tglSampai) params.set("tgl_sampai", tglSampai);
    const qs = params.toString();

    Promise.all([
      fetch(`/api/reports/summary${qs ? `?${qs}` : ""}`).then((r) => r.json()),
      fetch(`/api/reports/transactions${qs ? `?${qs}` : ""}`).then((r) => r.json()),
    ])
      .then(([s, t]) => {
        setSummary(s.data);
        setTransactions(t.data || []);
      })
      .finally(() => setLoading(false));
  }, [tglDari, tglSampai]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Laporan Keuangan" subtitle="Ringkasan pemasukan dan pengeluaran" />

      <div className="mb-6">
        <DateRangePicker from={tglDari} to={tglSampai} onChange={(f, t) => { setTglDari(f); setTglSampai(t); }} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Pemasukan" value={formatRupiah(summary?.total_pemasukan || 0)} icon={TrendingUp} color="bg-emerald-100 text-emerald-600" />
        <Card title="Pengeluaran" value={formatRupiah(summary?.total_pengeluaran || 0)} icon={TrendingDown} color="bg-red-100 text-red-600" />
        <Card title="Laba Bersih" value={formatRupiah(summary?.laba_bersih || 0)} icon={DollarSign} color="bg-sky-100 text-sky-600" />
        <Card title="Transaksi" value={`${summary?.total_transaksi || 0} transaksi`} icon={Receipt} color="bg-violet-100 text-violet-600" />
      </div>

      <h3 className="mb-3 text-lg font-semibold text-slate-900">Detail Transaksi</h3>
      <Table
        columns={[
          { key: "noTransaksi", header: "No. Invoice" },
          { key: "customer", header: "Customer", render: (t: any) => t.customer?.namaLengkap || "-" },
          { key: "kasir", header: "Kasir", render: (t: any) => t.kasir?.namaLengkap || "-" },
          { key: "total", header: "Total", render: (t: any) => formatRupiah(t.total) },
          { key: "metodeBayar", header: "Metode" },
          { key: "status", header: "Status", render: (t: any) => <Badge status={t.status} /> },
          { key: "tglTransaksi", header: "Tanggal", render: (t: any) => formatDate(t.tglTransaksi) },
        ]}
        data={transactions}
      />
    </div>
  );
}