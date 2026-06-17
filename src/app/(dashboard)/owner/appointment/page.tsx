"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateTime } from "@/lib/utils/format";

interface Appointment {
  id: string;
  tglJanji: string;
  jenis: string;
  status: string;
  pet: { id: string; nama: string; spesies: string };
  dokter: { id: string; namaLengkap: string } | null;
  customer: { id: string; namaLengkap: string };
}

export default function OwnerAppointmentPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/appointments").then(r => r.json()).then(j => setData(j.data || [])).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleUpdate() {
    if (!selected || !newStatus) return;
    await fetch(`/api/appointments/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    setSelected(null); setNewStatus(""); load();
  }

  if (loading) return <LoadingSpinner />;
  return (
    <div>
      <PageHeader title="Appointment" subtitle="Kelola semua appointment" />
      <Table columns={[
        { key: "tglJanji", header: "Tanggal", render: (a: Appointment) => formatDateTime(a.tglJanji) },
        { key: "pet", header: "Hewan", render: (a: Appointment) => `${a.pet.nama} (${a.pet.spesies})` },
        { key: "customer", header: "Pemilik", render: (a: Appointment) => a.customer.namaLengkap },
        { key: "dokter", header: "Dokter", render: (a: Appointment) => a.dokter?.namaLengkap || "-" },
        { key: "jenis", header: "Jenis" },
        { key: "status", header: "Status", render: (a: Appointment) => <Badge status={a.status} /> },
        { key: "aksi", header: "Aksi", render: (a: Appointment) => <Button size="sm" variant="outline" onClick={() => { setSelected(a); setNewStatus(a.status); }}>Update</Button> },
      ]} data={data} />
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Update Status">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{selected?.pet.nama} — {selected?.customer.namaLengkap}</p>
          <Select label="Status" options={[{ value: "pending", label: "Pending" }, { value: "konfirmasi", label: "Konfirmasi" }, { value: "selesai", label: "Selesai" }, { value: "batal", label: "Batal" }]} value={newStatus} onChange={setNewStatus} />
          <Button className="w-full" onClick={handleUpdate}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}