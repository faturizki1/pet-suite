"use client";

import { Button } from "@/components/ui/button";
import { PrintWrapper } from "@/components/ui/print-wrapper";
import { formatRupiah } from "@/lib/utils/format";

interface ReceiptItem {
  nama: string;
  qty: number;
  harga: number;
  subtotal: number;
}

interface ReceiptData {
  noTransaksi: string;
  items: ReceiptItem[];
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  uangDiterima?: number;
  kembalian?: number;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
}

export function ReceiptContent({ data, onClose }: ReceiptModalProps) {
  return (
    <div className="space-y-4">
      <PrintWrapper title={`Struk - ${data.noTransaksi}`} size="receipt">
        <div className="font-mono text-sm space-y-2" style={{ width: "80mm", padding: "8px" }}>
          <div className="text-center">
            <h2 className="font-bold text-base">VetCare Klinik Hewan</h2>
          </div>
          <div className="border-t border-dashed border-slate-300 my-2" />
          <div className="space-y-1 text-xs">
            <p>No: {data.noTransaksi}</p>
            <p>Tgl: {new Date().toLocaleString("id-ID")}</p>
          </div>
          <div className="border-t border-dashed border-slate-300 my-2" />
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-1">Item</th>
                <th className="text-center py-1">Qty</th>
                <th className="text-right py-1">Harga</th>
                <th className="text-right py-1">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-1">{item.nama}</td>
                  <td className="text-center py-1">{item.qty}</td>
                  <td className="text-right py-1">{formatRupiah(item.harga)}</td>
                  <td className="text-right py-1">{formatRupiah(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed border-slate-300 my-2" />
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(data.subtotal)}</span>
            </div>
            {data.diskon > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>-{formatRupiah(data.diskon)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatRupiah(data.total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar</span>
              <span className="uppercase">{data.metodeBayar}</span>
            </div>
            {data.uangDiterima && (
              <div className="flex justify-between">
                <span>Uang Diterima</span>
                <span>{formatRupiah(data.uangDiterima)}</span>
              </div>
            )}
            {data.kembalian !== undefined && data.kembalian > 0 && (
              <div className="flex justify-between">
                <span>Kembalian</span>
                <span>{formatRupiah(data.kembalian)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-dashed border-slate-300 my-2" />
          <p className="text-center text-xs text-slate-500">
            Terima kasih telah mempercayakan kesehatan hewan Anda kepada kami.
          </p>
        </div>
      </PrintWrapper>

      <Button className="w-full" onClick={onClose}>
        Tutup
      </Button>
    </div>
  );
}
