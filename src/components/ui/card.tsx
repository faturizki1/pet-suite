import { cn } from "@/lib/utils/cn";
import { LucideIcon } from "lucide-react";

interface CardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  color?: string;
  className?: string;
}

export function Card({ title, value, icon: Icon, trend, color, className }: CardProps) {
  return (
    <div className={cn("rounded-xl bg-white p-5 shadow-sm border border-slate-200", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-normal text-slate-500">{title}</p>
        {Icon && (
          <div className={cn("rounded-lg p-2", color || "bg-sky-100 text-sky-600")}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
    </div>
  );
}