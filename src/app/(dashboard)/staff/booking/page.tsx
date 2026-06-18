"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BookingTable, BookingData } from "@/components/modules/booking/booking-table";

export default function StaffBookingPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BookingData | null>(null);
  const [action, setAction] = useState<"dikonfirmasi" | "ditolak" | null>(null);
  const [alasan, setAlasan] = useState("");

  function loadData() {
    setLoading(true);
    fetch("/api/booking")
      .then((r) => r.json())
      .then((j) => setBookings(j.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAction() {
    if (!selected || !action) return;
    await fetch(`/api/booking/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action, alasan_tolak: action === "ditolak" ? alasan : undefined }),
    });
    setSelected(null);
    setAction(null);
    setAlasan("");
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Booking Online" subtitle="Konfirmasi booking dari pelanggan" />

      <BookingTable
        bookings={bookings}
        onConfirm={(b) => { setSelected(b); setAction("dikonfirmasi"); }}
        onReject={(b) => { setSelected(b); setAction("ditolak"); }}
      />

      <Modal
        open={!!selected && !!action}
        onClose={() => { setSelected(null); setAction(null); }}
        title={action === "dikonfirmasi" ? "Konfirmasi Booking" : "Tolak Booking"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {selected?.namaHewan} — {selected?.customer?.namaLengkap || selected?.namaGuest}
          </p>
          {action === "ditolak" && (
            <div className="w-full">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Alasan</label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          )}
          <Button className="w-full" onClick={handleAction}>
            {action === "dikonfirmasi" ? "Konfirmasi" : "Tolak"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}