import Link from "next/link";
import { PawPrint, Stethoscope, Scissors, Hotel } from "lucide-react";

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
            Kesehatan Hewan Peliharaan Anda,
            <br />
            <span className="text-sky-500">Prioritas Kami</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Klinik hewan profesional dengan dokter berpengalaman, fasilitas lengkap, dan pelayanan terbaik untuk hewan kesayangan Anda.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/booking"
              className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-medium text-white hover:bg-sky-600"
            >
              Booking Sekarang
            </Link>
            <Link
              href="/layanan"
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Lihat Layanan
            </Link>
          </div>
        </div>
      </section>

      {/* Layanan Unggulan */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">Layanan Unggulan</h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Kami menyediakan berbagai layanan untuk kesehatan hewan Anda
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100">
                <Stethoscope className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Konsultasi</h3>
              <p className="mt-2 text-sm text-slate-500">
                Pemeriksaan kesehatan menyeluruh oleh dokter hewan profesional.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Scissors className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Grooming</h3>
              <p className="mt-2 text-sm text-slate-500">
                Perawatan bulu, kuku, dan kebersihan hewan peliharaan Anda.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                <Hotel className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Rawat Inap</h3>
              <p className="mt-2 text-sm text-slate-500">
                Fasilitas rawat inap dengan monitoring 24 jam oleh tim medis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sky-500 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white">
            Butuh Konsultasi untuk Hewan Anda?
          </h2>
          <p className="mt-2 text-sky-100">
            Booking appointment sekarang dan dapatkan pelayanan terbaik dari dokter kami.
          </p>
          <Link
            href="/booking"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-medium text-sky-600 hover:bg-sky-50"
          >
            Booking Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}