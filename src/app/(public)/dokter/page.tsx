import { Stethoscope } from "lucide-react";

const doctors = [
  { name: "Drh. Andi Pratama", spesialisasi: "Hewan Kecil", bio: "Lulusan IPB dengan pengalaman 10 tahun menangani kucing dan anjing." },
  { name: "Drh. Siti Nurhaliza", spesialisasi: "Bedah", bio: "Spesialis bedah hewan dengan sertifikasi internasional." },
  { name: "Drh. Budi Santoso", spesialisasi: "Hewan Eksotis", bio: "Ahli reptil, burung, dan hewan eksotis lainnya." },
];

export default function DokterPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">Tim Dokter Kami</h1>
      <p className="mt-2 text-slate-500">Dokter hewan profesional dan berpengalaman</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {doctors.map((d) => (
          <div key={d.name} className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100">
              <Stethoscope className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{d.name}</h3>
            <p className="text-sm font-medium text-violet-600">{d.spesialisasi}</p>
            <p className="mt-2 text-sm text-slate-500">{d.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}