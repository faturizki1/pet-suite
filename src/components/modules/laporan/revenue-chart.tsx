"use client";

import { formatRupiah } from "@/lib/utils/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueItem {
  date: string;
  total: number;
}

export function RevenueChart({ data }: { data: RevenueItem[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">Belum ada data</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatRupiah(v)} />
        <Legend />
        <Line type="monotone" dataKey="total" name="Pemasukan" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}