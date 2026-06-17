"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface Slot {
  id: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  kuota: number;
  terisi: number;
  isAvailable: boolean;
  dokter?: { id: string; namaLengkap: string } | null;
}

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({
    nama_guest: "",
    no_hp_guest: "",
    nama_hewan: "",
    spesies: "",
    keluhan: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/booking/list")
      .then((res) => res.json())
      .then((json) => setSlots(json.data || []))
      .catch(() => {});
  }, []);

  function handleSlotSelect(slot: Slot) {
    setSelectedSlot(slot);
    setStep(2);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: selectedSlot?.id,
          nama_guest: form.nama_guest,
          no_hp_guest: form.no_hp_guest,
          nama_hewan: form.nama_hewan,
          spesies: form.spesies,
          keluhan: form.keluhan,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Booking gagal");
        return;
      }
      setStep(3);
      setSuccess(true);
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Calendar className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Booking Terkirim!</h1>
        <p className="mt-2 text-slate-500">
          Kami akan menghubungi Anda untuk konfirmasi jadwal.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step >= s ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-400"
              }`}
            >
              {s}
            </div>
            <span className="text-sm text-slate-500">
              {s === 1 ? "Pilih Jadwal" : s === 2 ? "Data Hewan" : "Konfirmasi"}
            </span>
            {s < 3 && <div className="h-px w-8 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Pilih Slot */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pilih Jadwal</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih slot yang tersedia</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                disabled={!slot.isAvailable || slot.terisi >= slot.kuota}
                onClick={() => handleSlotSelect(slot)}
                className={`rounded-lg border p-4 text-center transition-colors ${
                  slot.isAvailable && slot.terisi < slot.kuota
                    ? "border-sky-200 bg-sky-50 hover:bg-sky-100 cursor-pointer"
                    : "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-700">
                  {slot.jamMulai?.slice(0, 5)} - {slot.jamSelesai?.slice(0, 5)}
                </p>
                <p className="text-xs text-slate-500">{slot.tanggal}</p>
                {slot.dokter && (
                  <p className="mt-1 text-xs text-sky-600">{slot.dokter.namaLengkap}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {slot.terisi}/{slot.kuota} terisi
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Data Hewan */}
      {step === 2 && selectedSlot && (
        <div>
          <h2 className="text-xl font-bold text-slate-900">Data Hewan</h2>
          <p className="mt-1 text-sm text-slate-500">
            {selectedSlot.tanggal} | {selectedSlot.jamMulai?.slice(0, 5)} - {selectedSlot.jamSelesai?.slice(0, 5)}
            {selectedSlot.dokter && ` | ${selectedSlot.dokter.namaLengkap}`}
          </p>
          <div className="mt-6 space-y-4">
            <Input label="Nama Pemilik *" name="nama_guest" value={form.nama_guest} onChange={handleChange} required />
            <Input label="No HP *" name="no_hp_guest" value={form.no_hp_guest} onChange={handleChange} required />
            <Input label="Nama Hewan *" name="nama_hewan" value={form.nama_hewan} onChange={handleChange} required />
            <Input label="Spesies *" name="spesies" value={form.spesies} onChange={handleChange} required placeholder="Kucing, Anjing, dll" />
            <div className="w-full">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">Keluhan</label>
              <textarea
                name="keluhan"
                value={form.keluhan}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Ceritakan keluhan hewan Anda..."
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
              <Button onClick={handleSubmit} loading={loading}>Kirim Booking</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}