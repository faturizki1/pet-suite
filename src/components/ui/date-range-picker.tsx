"use client";

import { Input } from "./input";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="w-auto"
      />
      <span className="text-slate-400">s/d</span>
      <Input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="w-auto"
      />
    </div>
  );
}