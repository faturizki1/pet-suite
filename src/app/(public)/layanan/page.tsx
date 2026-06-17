import { Stethoscope, Scissors, Syringe, Heart, Activity } from "lucide-react";

const services = [
  { icon: Stethoscope, name: "Konsultasi Umum", desc: "Pemeriksaan kesehatan rutin dan konsultasi", price: "Rp 50.000" },
  { icon: Syringe, name: "Vaksinasi", desc: "Vaksinasi lengkap untuk berbagai jenis hewan", price: "Rp 75.000" },
  { icon: Scissors, name: "Grooming", desc: "Perawatan bulu, kuku, telinga, dan mandi", price: "Rp 80.000" },
  { icon: Activity, name: "Operasi", desc: "Tindakan operasi oleh dokter bedah berpengalaman", price: "Mulai Rp 500.000" },
  { icon: Heart, name: "Rawat Inap", desc: "Perawatan intensif dengan monitoring 24 jam", price: "Rp 150.000/hari" },
];

export default function LayananPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Layanan Kami</h1>
      <p className="mt-2 text-slate-500">Berbagai layanan profesional untuk kesehatan hewan peliharaan Anda</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={s.name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
              <s.icon className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{s.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            <p className="mt-3 text-sm font-semibold text-sky-600">{s.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}