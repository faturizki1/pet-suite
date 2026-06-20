"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ShoppingCart, Package, Calendar, ClipboardList } from "lucide-react";

export default function StaffDashboardPage() {
  const [stats, setStats] = useState({ transaksi: 0, stokMenipis: 0, appointment: 0, booking: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pos/transactions").then((r) => r.json()),
      fetch("/api/reports/stock-alert").then((r) => r.json()),
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/booking").then((r) => r.json()),
    ])
      .then(([tx, stock, appt, booking]) => {
        setStats({
          transaksi: tx.data?.length || 0,
          stokMenipis: stock.data?.length || 0,
          appointment: appt.data?.length || 0,
          booking: booking.data?.filter((b: { status: string }) => b.status === "menunggu").length || 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang, Staff" />

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Transaksi" value={`${stats.transaksi} hari ini`} icon={ShoppingCart} color="bg-emerald-100 text-emerald-600" />
        <Card title="Stok Menipis" value={`${stats.stokMenipis} produk`} icon={Package} color="bg-red-100 text-red-600" />
        <Card title="Appointment" value={`${stats.appointment} hari ini`} icon={Calendar} color="bg-sky-100 text-sky-600" />
        <Card title="Booking" value={`${stats.booking} menunggu`} icon={ClipboardList} color="bg-amber-100 text-amber-600" />
      </div>
    </div>
  );
}