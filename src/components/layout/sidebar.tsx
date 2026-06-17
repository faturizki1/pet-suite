"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  FileText,
  Users,
  PawPrint,
  Calendar,
  Bed,
  BookOpen,
  Settings,
  LogOut,
  ShoppingCart,
  Package,
  DollarSign,
  ClipboardList,
  Activity,
} from "lucide-react";

interface SidebarProps {
  role: string;
  userName: string;
}

const menuByRole: Record<string, { href: string; label: string; icon: React.ReactNode }[]> = {
  owner: [
    { href: "/owner/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/owner/laporan", label: "Laporan", icon: <FileText className="h-5 w-5" /> },
    { href: "/owner/users", label: "Manajemen User", icon: <Users className="h-5 w-5" /> },
    { href: "/owner/hewan", label: "Semua Hewan", icon: <PawPrint className="h-5 w-5" /> },
    { href: "/owner/appointment", label: "Appointment", icon: <Calendar className="h-5 w-5" /> },
    { href: "/owner/rawat-inap", label: "Rawat Inap", icon: <Bed className="h-5 w-5" /> },
    { href: "/owner/booking", label: "Booking Online", icon: <BookOpen className="h-5 w-5" /> },
    { href: "/owner/settings", label: "Pengaturan Klinik", icon: <Settings className="h-5 w-5" /> },
  ],
  dokter: [
    { href: "/dokter/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dokter/appointment", label: "Appointment Saya", icon: <Calendar className="h-5 w-5" /> },
    { href: "/dokter/rekam-medis", label: "Rekam Medis", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/dokter/rawat-inap", label: "Rawat Inap", icon: <Bed className="h-5 w-5" /> },
    { href: "/dokter/hewan", label: "Data Hewan", icon: <PawPrint className="h-5 w-5" /> },
  ],
  staff: [
    { href: "/staff/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/staff/pos", label: "POS Kasir", icon: <ShoppingCart className="h-5 w-5" /> },
    { href: "/staff/inventory", label: "Inventory", icon: <Package className="h-5 w-5" /> },
    { href: "/staff/appointment", label: "Appointment", icon: <Calendar className="h-5 w-5" /> },
    { href: "/staff/rawat-inap", label: "Rawat Inap", icon: <Bed className="h-5 w-5" /> },
    { href: "/staff/pengeluaran", label: "Pengeluaran", icon: <DollarSign className="h-5 w-5" /> },
    { href: "/staff/booking", label: "Booking Online", icon: <BookOpen className="h-5 w-5" /> },
  ],
  customer: [
    { href: "/customer/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/customer/hewan", label: "Hewan Saya", icon: <PawPrint className="h-5 w-5" /> },
    { href: "/customer/rekam-medis", label: "Rekam Medis", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/customer/monitoring", label: "Monitoring", icon: <Activity className="h-5 w-5" /> },
  ],
};

const roleAccent: Record<string, string> = {
  owner: "bg-sky-500",
  dokter: "bg-violet-500",
  staff: "bg-emerald-500",
  customer: "bg-sky-500",
};

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const menu = menuByRole[role] || [];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", roleAccent[role] || "bg-sky-500")}>
          <PawPrint className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">VetCare</span>
      </div>

      {/* User Info */}
      <div className="border-b border-slate-800 px-6 py-4">
        <p className="text-sm font-medium text-white">{userName}</p>
        <span className="mt-0.5 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-400">
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menu.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 px-3 py-4">
        <Link
          href="/api/auth/logout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}