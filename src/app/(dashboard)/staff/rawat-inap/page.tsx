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

interface Inpatient {
  id: string;
  noKandang: string;
  tglMasuk: string;
  status: string;
  pet: { id: string; nama: string; spesies: string };
  dokter: { id: string; namaLengkap: string };
}

export default function StaffRawatInapPage() {
  const [data, setData] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState<Inpatient | null>(null);
  const [logForm, setLogForm] = useState({
    kondisi: "stabil",
    catatan_kondisi: "",
    is_visible_customer: true,
  });

  function loadData() {
    setLoading(true);
    fetch("/api/inpatients")
      .then((r) => r.json())
      .then((j) => setData(j.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddLog() {
    if (!showLog) return;
    const res = await fetch(`/api/inpatients/${showLog.id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logForm),
    });
    if (res.ok) {
      setShowLog(null);
      setLogForm({ kondisi: "stabil", catatan_kondisi: "", is_visible_customer: true });
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Rawat Inap" subtitle="Monitoring pasien rawat inap" />

      <Table
        columns={[
          { key: "noKandang", header: "Kandang" },
          { key: "pet", header: "Hewan", render: (r: Inpatient) => `${r.pet.nama} (${r.pet.spesies})` },
          { key: "dokter", header: "Dokter", render: (r: Inpatient) => r.dokter.namaLengkap },
          { key: "tglMasuk", header: "Masuk", render: (r: Inpatient) => formatDate(r.tglMasuk) },
          { key: "status", header: "Status", render: (r: Inpatient) => <Badge status={r.status} /> },
          {
            key: "aksi",
            header: "Aksi",
            render: (r: Inpatient) => (
              <Button size="sm" variant="outline" onClick={() => setShowLog(r)}>
                + Log
              </Button>
            ),
          },
        ]}
        data={data}
      />

      <Modal open={!!showLog} onClose={() => setShowLog(null)} title="Tambah Log Monitoring">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {showLog?.pet.nama} — Kandang {showLog?.noKandang}
          </p>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Kondisi</label>
            <select
              value={logForm.kondisi}
              onChange={(e) => setLogForm({ ...logForm, kondisi: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {["kritis", "lemah", "stabil", "baik", "sangat_baik"].map((k) => (
                <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <Input label="Catatan Kondisi *" value={logForm.catatan_kondisi} onChange={(e) => setLogForm({ ...logForm, catatan_kondisi: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={logForm.is_visible_customer} onChange={(e) => setLogForm({ ...logForm, is_visible_customer: e.target.checked })} />
            Tampilkan ke customer
          </label>
          <Button className="w-full" onClick={handleAddLog}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}