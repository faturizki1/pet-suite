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
import { PawPrint } from "lucide-react";

interface Pet {
  id: string;
  nama: string;
  spesies: string;
  ras: string | null;
  jenisKelamin: string | null;
  tglLahir: string | null;
  status: string;
  foto: string | null;
}

export default function CustomerHewanPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nama: "", spesies: "", ras: "", jenis_kelamin: "", tgl_lahir: "" });

  function loadData() {
    setLoading(true);
    fetch("/api/pets")
      .then((r) => r.json())
      .then((j) => setPets(j.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd() {
    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, owner_id: "" }),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ nama: "", spesies: "", ras: "", jenis_kelamin: "", tgl_lahir: "" });
      loadData();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Hewan Saya"
        subtitle="Data hewan peliharaan Anda"
        action={{ label: "Tambah Hewan", onClick: () => setShowAdd(true) }}
      />

      <Table
        columns={[
          { key: "nama", header: "Nama" },
          { key: "spesies", header: "Spesies" },
          { key: "ras", header: "Ras", render: (p: Pet) => p.ras || "-" },
          { key: "jenisKelamin", header: "Kelamin", render: (p: Pet) => p.jenisKelamin || "-" },
          { key: "tglLahir", header: "Tgl Lahir", render: (p: Pet) => p.tglLahir ? formatDate(p.tglLahir) : "-" },
          { key: "status", header: "Status", render: (p: Pet) => <Badge status={p.status} /> },
        ]}
        data={pets}
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Tambah Hewan">
        <div className="space-y-4">
          <Input label="Nama *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          <Input label="Spesies *" value={form.spesies} onChange={(e) => setForm({ ...form, spesies: e.target.value })} placeholder="Kucing, Anjing, dll" />
          <Input label="Ras" value={form.ras} onChange={(e) => setForm({ ...form, ras: e.target.value })} />
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Jenis Kelamin</label>
            <select value={form.jenis_kelamin} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })} className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Pilih...</option>
              <option value="jantan">Jantan</option>
              <option value="betina">Betina</option>
            </select>
          </div>
          <Input label="Tanggal Lahir" type="date" value={form.tgl_lahir} onChange={(e) => setForm({ ...form, tgl_lahir: e.target.value })} />
          <Button className="w-full" onClick={handleAdd}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}