"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function OwnerSettingsPage() {
  const [form, setForm] = useState({
    nama_klinik: "",
    alamat: "",
    no_hp: "",
    email: "",
    footer_struk: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/clinic")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setForm({
            nama_klinik: j.data.namaKlinik || "",
            alamat: j.data.alamat || "",
            no_hp: j.data.noHp || "",
            email: j.data.email || "",
            footer_struk: j.data.footerStruk || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings/clinic", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Pengaturan Klinik" subtitle="Atur informasi klinik" />
      <div className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <Input label="Nama Klinik *" value={form.nama_klinik} onChange={(e) => setForm({ ...form, nama_klinik: e.target.value })} />
        <Input label="Alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
        <Input label="No. HP" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="w-full">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Footer Struk</label>
          <textarea
            value={form.footer_struk}
            onChange={(e) => setForm({ ...form, footer_struk: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <Button className="w-full" onClick={handleSave} loading={saving}>Simpan</Button>
      </div>
    </div>
  );
}