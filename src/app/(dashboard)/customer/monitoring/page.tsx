"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateTime } from "@/lib/utils/format";
import { Activity } from "lucide-react";

interface Log {
  id: string;
  timestamp: string;
  kondisi: string;
  catatanKondisi: string;
  staff: { id: string; namaLengkap: string };
}

interface Inpatient {
  id: string;
  noKandang: string;
  tglMasuk: string;
  status: string;
  pet: { id: string; nama: string; spesies: string };
  logs: Log[];
}

export default function CustomerMonitoringPage() {
  const [data, setData] = useState<Inpatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inpatients?status=aktif")
      .then((r) => r.json())
      .then((j) => setData(j.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Monitoring" subtitle="Pantau kondisi hewan rawat inap" />

      {data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <Activity className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Tidak ada hewan yang sedang rawat inap</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((inp) => (
            <div key={inp.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{inp.pet.nama}</h3>
                  <p className="text-sm text-slate-500">
                    {inp.pet.spesies} — Kandang {inp.noKandang}
                  </p>
                </div>
                <Badge status={inp.status} />
              </div>

              <h4 className="mb-3 text-sm font-semibold text-slate-700">Timeline Monitoring</h4>
              <div className="space-y-3">
                {inp.logs?.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada log monitoring</p>
                ) : (
                  inp.logs?.map((log) => (
                    <div key={log.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <Badge status={log.kondisi} />
                        <span className="text-xs text-slate-400">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{log.catatanKondisi}</p>
                      <p className="mt-1 text-xs text-slate-400">— {log.staff.namaLengkap}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}