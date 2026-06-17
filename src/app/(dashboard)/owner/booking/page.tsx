"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateTime } from "@/lib/utils/format";

interface Booking {
  id: string;
  namaHewan: string;
  spesies: string;
  status: string;
  createdAt: string;
  slot: { tanggal: string; jamMulai: string; dokter: { id: string; namaLengkap: string } | null };
  customer: { id: string; namaLengkap: string } | null;
  namaGuest: string | null;
}

export default function OwnerBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [action, setAction] = useState<"dikonfirmasi" | "ditolak" | null>(null);
  const [alasan, setAlasan] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/booking").then(r => r.json()).then(j => setBookings(j.data || [])).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleAction() {
    if (!selected || !action) return;
    await fetch(`/api/booking/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: action, alasan_tolak: action === "ditolak" ? alasan : undefined }) });
    setSelected(null); setAction(null); setAlasan(""); load();
  }

  if (loading) return <LoadingSpinner />;
  return (
    <div>
      <PageHeader title="Booking Online" subtitle="Kelola slot dan booking" />
      <Table columns={[
        { key: "createdAt", header: "Tanggal", render: (b: Booking) => formatDateTime(b.createdAt) },
        { key: "nama", header: "Nama", render: (b: Booking) => b.customer?.namaLengkap || b.namaGuest || "-" },
        { key: "namaHewan", header: "Hewan" },
        { key: "slot", header: "Slot", render: (b: Booking) => `${b.slot.tanggal} ${b.slot.jamMulai?.slice(0,5)}` },
        { key: "status", header: "Status", render: (b: Booking) => <Badge status={b.status} /> },
        { key: "aksi", header: "Aksi", render: (b: Booking) => b.status === "menunggu" ? <div className="flex gap-1"><Button size="sm" onClick={() => { setSelected(b); setAction("dikonfirmasi"); }}>✅</Button><Button size="sm" variant="destructive" onClick={() => { setSelected(b); setAction("ditolak"); }}>❌</Button></div> : null },
      ]} data={bookings} />
      <Modal open={!!selected && !!action} onClose={() => { setSelected(null); setAction(null); }} title={action === "dikonfirmasi" ? "Konfirmasi Booking" : "Tolak Booking"}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{selected?.namaHewan} — {selected?.customer?.namaLengkap || selected?.namaGuest}</p>
          {action === "ditolak" && <div className="w-full"><label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Alasan</label><textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} /></div>}
          <Button className="w-full" onClick={handleAction}>{action === "dikonfirmasi" ? "Konfirmasi" : "Tolak"}</Button>
        </div>
      </Modal>
    </div>
  );
}