import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">VetCare</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/layanan" className="text-sm text-slate-600 hover:text-sky-500">
              Layanan
            </Link>
            <Link href="/dokter" className="text-sm text-slate-600 hover:text-sky-500">
              Dokter
            </Link>
            <Link href="/booking" className="text-sm text-slate-600 hover:text-sky-500">
              Booking
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} VetCare. All rights reserved.
      </footer>
    </div>
  );
}