"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  laporan: "Laporan",
  users: "Manajemen User",
  hewan: "Data Hewan",
  appointment: "Appointment",
  "rawat-inap": "Rawat Inap",
  booking: "Booking Online",
  settings: "Pengaturan Klinik",
  "rekam-medis": "Rekam Medis",
  pos: "POS Kasir",
  inventory: "Inventory",
  pengeluaran: "Pengeluaran",
  monitoring: "Monitoring",
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const role = segments[0] || "";
  const page = segments[1] || "";
  const pageLabel = breadcrumbMap[page] || page;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 capitalize">{role}</span>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{pageLabel}</span>
      </div>
    </header>
  );
}