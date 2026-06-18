"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/format";

export interface BookingData {
  id: string;
  namaHewan: string;
  spesies: string;
  status: string;
  keluhan: string | null;
  createdAt: string;
  slot: { tanggal: string; jamMulai: string; jamSelesai: string; dokter: { id: string; namaLengkap: string } | null };
  customer: { id: string; namaLengkap: string; noHp: string } | null;
  namaGuest: string | null;
  noHpGuest: string | null;
}

interface BookingTableProps {
  bookings: BookingData[];
  onConfirm: (booking: BookingData) => void;
  onReject: (booking: BookingData) => void;
}

export function BookingTable({ bookings, onConfirm, onReject }: BookingTableProps) {
  return (
    <Table<BookingData>
      columns={[
        { key: "createdAt", header: "Tanggal Booking", render: (b) => formatDateTime(b.createdAt) },
        { key: "nama", header: "Nama", render: (b) => b.customer?.namaLengkap || b.namaGuest || "-" },
        { key: "namaHewan", header: "Hewan" },
        { key: "spesies", header: "Spesies" },
        { key: "slot", header: "Slot", render: (b) => `${b.slot.tanggal} ${b.slot.jamMulai?.slice(0, 5)}` },
        { key: "status", header: "Status", render: (b) => <Badge status={b.status} /> },
        {
          key: "aksi",
          header: "Aksi",
          render: (b) =>
            b.status === "menunggu" ? (
              <div className="flex gap-1">
                <Button size="sm" onClick={() => onConfirm(b)}>✅</Button>
                <Button size="sm" variant="destructive" onClick={() => onReject(b)}>❌</Button>
              </div>
            ) : null,
        },
      ]}
      data={bookings}
    />
  );
}