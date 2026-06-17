"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils/format";

interface Pet {
  id: string;
  nama: string;
  spesies: string;
  ras: string | null;
  jenisKelamin: string | null;
  tglLahir: string | null;
  status: string;
  owner: { id: string; namaLengkap: string; noHp: string | null };
}

export default function DokterHewanPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/pets").then(r => r.json()).then(j => setPets(j.data || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingSpinner />;
  return (
    <div>
      <PageHeader title="Data Hewan" subtitle="Semua data hewan terdaftar" />
      <Table columns={[
        { key: "nama", header: "Nama" },
        { key: "spesies", header: "Spesies" },
        { key: "ras", header: "Ras", render: (p: Pet) => p.ras || "-" },
        { key: "jenisKelamin", header: "Kelamin", render: (p: Pet) => p.jenisKelamin || "-" },
        { key: "owner", header: "Pemilik", render: (p: Pet) => `${p.owner.namaLengkap} (${p.owner.noHp || "-"})` },
        { key: "status", header: "Status", render: (p: Pet) => <Badge status={p.status} /> },
      ]} data={pets} />
    </div>
  );
}