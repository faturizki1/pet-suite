"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/format";

interface PaymentModalProps {
  total: number;
  metodeBayar: string;
  uangDiterima: string;
  kembalian: number;
  error: string;
  submitting: boolean;
  onMetodeBayarChange: (m: string) => void;
  onUangDiterimaChange: (v: string) => void;
  onSubmit: () => void;
}

const METODE_LIST = ["tunai", "transfer", "qris", "debit"];

export function PaymentModalContent({
  total,
  metodeBayar,
  uangDiterima,
  kembalian,
  error,
  submitting,
  onMetodeBayarChange,
  onUangDiterimaChange,
  onSubmit,
}: PaymentModalProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm text-slate-500">Total</p>
        <p className="text-2xl font-bold text-sky-600">{formatRupiah(total)}</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
          Metode Bayar
        </label>
        <div className="grid grid-cols-2 gap-2">
          {METODE_LIST.map((m) => (
            <button
              key={m}
              onClick={() => onMetodeBayarChange(m)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                metodeBayar === m
                  ? "border-sky-500 bg-sky-50 text-sky-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {metodeBayar === "tunai" && (
        <Input
          label="Uang Diterima"
          type="number"
          value={uangDiterima}
          onChange={(e) => onUangDiterimaChange(e.target.value)}
          placeholder="0"
        />
      )}

      {metodeBayar === "tunai" && Number(uangDiterima) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Kembalian</span>
          <span className="font-semibold text-emerald-600">
            {formatRupiah(Math.max(0, kembalian))}
          </span>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        className="w-full"
        onClick={onSubmit}
        loading={submitting}
        disabled={metodeBayar === "tunai" && Number(uangDiterima) < total}
      >
        Konfirmasi Pembayaran
      </Button>
    </div>
  );
}