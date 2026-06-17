"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils/format";

interface Inpatient {
  id: string;
  noKandang: string;
  tglMasuk: string;
  status: string;
  pet: { id: string; nama: string; spesies: string };
  dokter: { id: string; namaLengkap: string };
}

export default function OwnerRawatInapPage() {
  const [data, setData] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/inpatients").then(r => r.json()).then(j => setData(j.data || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  return (
    <div>
      <PageHeader title="Rawat Inap" subtitle="Kelola pasien rawat inap" />
      <Table columns={[
        { key: "noKandang", header: "Kandang" },
        { key: "pet", header: "Hewan", render: (r: Inpatient) => `${r.pet.nama} (${r.pet.spesies})` },
        { key: "dokter", header: "Dokter", render: (r: Inpatient) => r.dokter.namaLengkap },
        { key: "tglMasuk", header: "Masuk", render: (r: Inpatient) => formatDate(r.tglMasuk) },
        { key: "status", header: "Status", render: (r: Inpatient) => <Badge status={r.status} /> },
      ]} data={data} />
    </div>
  );
}