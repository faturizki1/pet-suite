"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDate } from "@/lib/utils/format";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

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
      "No. Invoice",
      "Customer",
      "Kasir",
      "Subtotal",
      "Diskon",
      "Total",
      "Metode Bayar",
      "Status",
      "Tanggal",
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

    const csvContent = [
      headers.join(","),
      ...rows.map((r: string[]) => r.join(",")),
    ].join("\n");

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
      <PageHeader
        title="Laporan Keuangan"
        subtitle="Ringkasan pemasukan dan pengeluaran"
      />

      <div className="mb-6">
        <DateRangePicker
          from={tglDari}
          to={tglSampai}
          onChange={(f, t) => {
            setTglDari(f);
            setTglSampai(t);
          }}
        />
      </div>

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

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Pemasukan per Hari
          </h3>
          {revenueData.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Metode Pembayaran
          </h3>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  dataKey="total"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ method, total }: { method: string; total: number }) =>
                    `${method} (${formatRupiah(total)})`
                  }
                >
                  {paymentMethods.map((_: PaymentMethodItem, i: number) => (
                    <Cell
                      key={i}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Top 10 Produk
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nama"
                  tick={{ fontSize: 10 }}
                  width={90}
                />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
                <Bar dataKey="total" name="Total Penjualan" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">
            Pemasukan per Kategori
          </h3>
          {summary ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    kategori: "Produk",
                    total: Number(summary?.total_pemasukan_produk || 0),
                  },
                  {
                    kategori: "Layanan",
                    total: Number(summary?.total_pemasukan_layanan || 0),
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="kategori" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatRupiah(v)} />
                <Legend />
                <Bar
                  dataKey="total"
                  name="Pemasukan"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400">Belum ada data</p>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Detail Transaksi
        </h3>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <Table<TransactionData>
        columns={[
          { key: "noTransaksi", header: "No. Invoice" },
          {
            key: "customer",
            header: "Customer",
            render: (t: TransactionData) => t.customer?.namaLengkap || "-",
          },
          {
            key: "kasir",
            header: "Kasir",
            render: (t: TransactionData) => t.kasir?.namaLengkap || "-",
          },
          {
            key: "total",
            header: "Total",
            render: (t: TransactionData) => formatRupiah(t.total),
          },
          { key: "metodeBayar", header: "Metode" },
          {
            key: "status",
            header: "Status",
            render: (t: TransactionData) => <Badge status={t.status} />,
          },
          {
            key: "tglTransaksi",
            header: "Tanggal",
            render: (t: TransactionData) => formatDate(t.tglTransaksi),
          },
        ]}
        data={transactions}
      />
    </div>
  );
}