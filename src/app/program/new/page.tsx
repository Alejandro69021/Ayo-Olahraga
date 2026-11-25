import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileWizard } from "@/components/program/ProfileWizard";

export default function NewProgramPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-metric text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
              Buat Program Latihan
            </h1>
            <p className="text-xs text-zinc-400">
              Susun jadwal otomatis berbasis alat dan kondisi Anda
            </p>
          </div>
        </div>
      </header>

      <ProfileWizard />
    </main>
  );
}
