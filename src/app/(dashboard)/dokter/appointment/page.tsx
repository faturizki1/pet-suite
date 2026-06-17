"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateTime } from "@/lib/utils/format";

interface Appointment {
  id: string;
  tglJanji: string;
  jenis: string;
  status: string;
  keluhan: string | null;
  pet: { id: string; nama: string; spesies: string };
  customer: { id: string; namaLengkap: string; noHp: string | null };
}

export default function DokterAppointmentPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/appointments").then(r => r.json()).then(j => setData(j.data || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  return (
    <div>
      <PageHeader title="Appointment Saya" subtitle="Jadwal appointment hari ini" />
      <Table columns={[
        { key: "tglJanji", header: "Tanggal", render: (a: Appointment) => formatDateTime(a.tglJanji) },
        { key: "pet", header: "Hewan", render: (a: Appointment) => `${a.pet.nama} (${a.pet.spesies})` },
        { key: "customer", header: "Pemilik", render: (a: Appointment) => a.customer.namaLengkap },
        { key: "jenis", header: "Jenis" },
        { key: "keluhan", header: "Keluhan", render: (a: Appointment) => a.keluhan || "-" },
        { key: "status", header: "Status", render: (a: Appointment) => <Badge status={a.status} /> },
      ]} data={data} />
    </div>
  );
}