"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDate } from "@/lib/utils/format";
import { Download } from "lucide-react";
import { SummaryCards } from "@/components/modules/laporan/summary-cards";
import { RevenueChart } from "@/components/modules/laporan/revenue-chart";
import { PaymentPieChart } from "@/components/modules/laporan/payment-pie-chart";
import { TopProductsChart } from "@/components/modules/laporan/top-products-chart";

interface SummaryData {
  total_pemasukan: number;
  total_pengeluaran: number;
  laba_bersih: number;
  total_transaksi: number;
  total_pemasukan_produk?: number;
  total_pemasukan_layanan?: number;
}

interface TransactionData {
  id: string;
  noTransaksi: string;
  customer?: { namaLengkap: string } | null;
  kasir?: { namaLengkap: string } | null;
  subtotal: string;
  diskonNominal: string;
  total: string;
  metodeBayar: string | null;
  status: string;
  tglTransaksi: string;
}

interface RevenueItem {
  date: string;
  total: number;
}

interface PaymentMethodItem {
  method: string;
  total: number;
}

interface TopProductItem {
  nama: string;
  qty: number;
  total: number;
}

export default function LaporanPage() {
  const [tglDari, setTglDari] = useState("");
  const [tglSampai, setTglSampai] = useState("");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams();
    if (tglDari) params.set("tgl_dari", tglDari);
    if (tglSampai) params.set("tgl_sampai", tglSampai);
    const qs = params.toString();
    const base = qs ? `?${qs}` : "";

    setLoading(true);
    Promise.all([
      fetch(`/api/reports/summary${base}`).then((r) => r.json()),
      fetch(`/api/reports/transactions${base}`).then((r) => r.json()),
      fetch(`/api/reports/revenue${base}`).then((r) => r.json()),
      fetch(`/api/reports/payment-methods${base}`).then((r) => r.json()),
      fetch(`/api/reports/top-products${base}`).then((r) => r.json()),
    ])
      .then(([s, t, rev, pm, tp]) => {
        setSummary(s.data);
        setTransactions(t.data || []);
        setRevenueData(rev.data || []);
        setPaymentMethods(pm.data || []);
        setTopProducts(tp.data || []);
      })
      .finally(() => setLoading(false));
  }, [tglDari, tglSampai]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function exportCSV() {
    const headers = [
      "No. Invoice", "Customer", "Kasir", "Subtotal", "Diskon",
      "Total", "Metode Bayar", "Status", "Tanggal",
    ];
    const rows = transactions.map((t: TransactionData) => [
      t.noTransaksi,
      t.customer?.namaLengkap || "-",
      t.kasir?.namaLengkap || "-",
      t.subtotal,
      t.diskonNominal || "0",
      t.total,
      t.metodeBayar || "-",
      t.status,
      formatDate(t.tglTransaksi),
    ]);
    const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Laporan Keuangan" subtitle="Ringkasan pemasukan dan pengeluaran" />

      <div className="mb-6">
        <DateRangePicker from={tglDari} to={tglSampai} onChange={(f, t) => { setTglDari(f); setTglSampai(t); }} />
      </div>

      <SummaryCards data={summary} />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Pemasukan per Hari</h3>
          <RevenueChart data={revenueData} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Metode Pembayaran</h3>
          <PaymentPieChart data={paymentMethods} />
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Top 10 Produk</h3>
          <TopProductsChart data={topProducts} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Pemasukan per Kategori</h3>
          {summary ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-3xl font-bold text-violet-600">{formatRupiah(summary.total_pemasukan_produk || 0)}</p>
                  <p className="text-sm text-slate-500">Produk</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-600">{formatRupiah(summary.total_pemasukan_layanan || 0)}</p>
                  <p className="text-sm text-slate-500">Layanan</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Belum ada data</p>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Detail Transaksi</h3>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      <Table<TransactionData>
        columns={[
          { key: "noTransaksi", header: "No. Invoice" },
          { key: "customer", header: "Customer", render: (t) => t.customer?.namaLengkap || "-" },
          { key: "kasir", header: "Kasir", render: (t) => t.kasir?.namaLengkap || "-" },
          { key: "total", header: "Total", render: (t) => formatRupiah(t.total) },
          { key: "metodeBayar", header: "Metode" },
          { key: "status", header: "Status", render: (t) => <Badge status={t.status} /> },
          { key: "tglTransaksi", header: "Tanggal", render: (t) => formatDate(t.tglTransaksi) },
        ]}
        data={transactions}
      />
    </div>
  );
}