"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ShoppingCart, Package, Calendar, BookOpen } from "lucide-react";

export default function StaffDashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Selamat datang, Staff" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Transaksi Hari Ini" value="0" icon={ShoppingCart} color="bg-emerald-100 text-emerald-600" />
        <Card title="Stok Menipis" value="0" icon={Package} color="bg-amber-100 text-amber-600" />
        <Card title="Appointment Hari Ini" value="0" icon={Calendar} color="bg-sky-100 text-sky-600" />
        <Card title="Booking Menunggu" value="0" icon={BookOpen} color="bg-violet-100 text-violet-600" />
      </div>
    </div>
  );
}