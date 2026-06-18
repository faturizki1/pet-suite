"use client";

import { formatRupiah } from "@/lib/utils/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TopProductItem {
  nama: string;
  qty: number;
  total: number;
}

export function TopProductsChart({ data }: { data: TopProductItem[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">Belum ada data</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="nama" tick={{ fontSize: 10 }} width={90} />
        <Tooltip formatter={(v: number) => formatRupiah(v)} />
        <Legend />
        <Bar dataKey="total" name="Total Penjualan" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}