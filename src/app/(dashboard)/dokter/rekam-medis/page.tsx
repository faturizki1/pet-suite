"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils/format";

interface MedicalRecord {
  id: string;
  tanggal: string;
  diagnosis: string;
  keluhan: string | null;
  isVisibleCustomer: boolean;
  pet: { id: string; nama: string; spesies: string };
  dokter: { id: string; namaLengkap: string };
}

export default function DokterRekamMedisPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    pet_id: "",
    diagnosis: "",
    keluhan: "",
    tindakan: "",
    is_visible_customer: true,
  });

  function loadData() {
    setLoading(true);
    fetch("/api/medical-records")
      .then((r) => r.json())
      .then((j) => setRecords(j.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd() {
    const res = await fetch("/api/medical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ pet_id: "", diagnosis: "", keluhan: "", tindakan: "", is_visible_customer: true });
      loadData();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Rekam Medis"
        subtitle="Input dan lihat rekam medis"
        action={{ label: "Tambah Rekam Medis", onClick: () => setShowAdd(true) }}
      />

      <Table
        columns={[
          { key: "tanggal", header: "Tanggal", render: (r: MedicalRecord) => formatDate(r.tanggal) },
          { key: "pet", header: "Hewan", render: (r: MedicalRecord) => `${r.pet.nama} (${r.pet.spesies})` },
          { key: "diagnosis", header: "Diagnosis" },
          { key: "keluhan", header: "Keluhan", render: (r: MedicalRecord) => r.keluhan || "-" },
          {
            key: "isVisibleCustomer",
            header: "Visible",
            render: (r: MedicalRecord) => <Badge status={r.isVisibleCustomer ? "aktif" : "batal"} />,
          },
        ]}
        data={records}
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Rekam Medis">
        <div className="space-y-4">
          <Input label="ID Hewan *" value={form.pet_id} onChange={(e) => setForm({ ...form, pet_id: e.target.value })} placeholder="UUID hewan" />
          <Input label="Diagnosis *" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
          <Input label="Keluhan" value={form.keluhan} onChange={(e) => setForm({ ...form, keluhan: e.target.value })} />
          <Input label="Tindakan" value={form.tindakan} onChange={(e) => setForm({ ...form, tindakan: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_visible_customer} onChange={(e) => setForm({ ...form, is_visible_customer: e.target.checked })} />
            Tampilkan ke customer
          </label>
          <Button className="w-full" onClick={handleAdd}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}