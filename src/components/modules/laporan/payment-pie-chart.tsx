"use client";

import { formatRupiah } from "@/lib/utils/format";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

interface PaymentMethodItem {
  method: string;
  total: number;
}

export function PaymentPieChart({ data }: { data: PaymentMethodItem[] }) {
  if (data.length === 0) return <p className="text-sm text-slate-400">Belum ada data</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="method"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ method, total }: { method: string; total: number }) =>
            `${method} (${formatRupiah(total)})`
          }
        >
          {data.map((_: PaymentMethodItem, i: number) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatRupiah(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}