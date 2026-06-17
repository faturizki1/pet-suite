"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDate } from "@/lib/utils/format";

interface User {
  id: string;
  email: string;
  role: string;
  namaLengkap: string;
  noHp: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ nama_lengkap: "", no_hp: "", is_active: true });

  function loadData() {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((j) => setUsers(j.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleUpdate() {
    if (!showEdit) return;
    const res = await fetch(`/api/users/${showEdit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setShowEdit(null);
      loadData();
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Manajemen User" subtitle="Kelola semua pengguna platform" />

      <Table
        columns={[
          { key: "namaLengkap", header: "Nama" },
          { key: "email", header: "Email" },
          { key: "role", header: "Role", render: (u: User) => <Badge status={u.role} /> },
          { key: "noHp", header: "No. HP", render: (u: User) => u.noHp || "-" },
          { key: "isActive", header: "Status", render: (u: User) => <Badge status={u.isActive ? "aktif" : "batal"} /> },
          { key: "createdAt", header: "Bergabung", render: (u: User) => formatDate(u.createdAt) },
          {
            key: "aksi",
            header: "Aksi",
            render: (u: User) => (
              <Button size="sm" variant="outline" onClick={() => { setShowEdit(u); setEditForm({ nama_lengkap: u.namaLengkap, no_hp: u.noHp || "", is_active: u.isActive }); }}>
                Edit
              </Button>
            ),
          },
        ]}
        data={users}
      />

      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit User">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{showEdit?.email} — <Badge status={showEdit?.role || ""} /></p>
          <Input label="Nama Lengkap" value={editForm.nama_lengkap} onChange={(e) => setEditForm({ ...editForm, nama_lengkap: e.target.value })} />
          <Input label="No. HP" value={editForm.no_hp} onChange={(e) => setEditForm({ ...editForm, no_hp: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
            Akun aktif
          </label>
          <Button className="w-full" onClick={handleUpdate}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}