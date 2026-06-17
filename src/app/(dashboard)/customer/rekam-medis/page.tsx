"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils/format";

interface MedicalRecord {
  id: string;
  tanggal: string;
  diagnosis: string;
  keluhan: string | null;
  pet: { id: string; nama: string; spesies: string };
  dokter: { id: string; namaLengkap: string };
}

export default function CustomerRekamMedisPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/medical-records")
      .then((r) => r.json())
      .then((j) => setRecords(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Rekam Medis" subtitle="Riwayat kesehatan hewan Anda" />
      <Table
        columns={[
          { key: "tanggal", header: "Tanggal", render: (r: MedicalRecord) => formatDate(r.tanggal) },
          { key: "pet", header: "Hewan", render: (r: MedicalRecord) => `${r.pet.nama} (${r.pet.spesies})` },
          { key: "dokter", header: "Dokter", render: (r: MedicalRecord) => r.dokter.namaLengkap },
          { key: "diagnosis", header: "Diagnosis" },
          { key: "keluhan", header: "Keluhan", render: (r: MedicalRecord) => r.keluhan || "-" },
        ]}
        data={records}
      />
    </div>
  );
}