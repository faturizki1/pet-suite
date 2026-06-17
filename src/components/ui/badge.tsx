import { cn } from "@/lib/utils/cn";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  konfirmasi: "bg-sky-100 text-sky-700",
  selesai: "bg-emerald-100 text-emerald-700",
  batal: "bg-red-100 text-red-700",
  aktif: "bg-emerald-100 text-emerald-700",
  sembuh: "bg-sky-100 text-sky-700",
  dirujuk: "bg-violet-100 text-violet-700",
  meninggal: "bg-slate-100 text-slate-600",
  kritis: "bg-red-100 text-red-700",
  lemah: "bg-orange-100 text-orange-700",
  stabil: "bg-amber-100 text-amber-700",
  baik: "bg-sky-100 text-sky-700",
  sangat_baik: "bg-emerald-100 text-emerald-700",
  lunas: "bg-emerald-100 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  menunggu: "bg-amber-100 text-amber-700",
  dikonfirmasi: "bg-sky-100 text-sky-700",
  ditolak: "bg-red-100 text-red-700",
};

interface BadgeProps {
  status: string;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  const color = statusColors[status] || "bg-slate-100 text-slate-600";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        color,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}