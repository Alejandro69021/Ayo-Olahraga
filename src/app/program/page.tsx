import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { ProgramView } from "@/components/program/ProgramView";
import { VolumeChart } from "@/components/program/VolumeChart";

export default function ProgramPage() {
  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
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
              Program Latihan
            </h1>
            <p className="text-xs text-zinc-400">
              Jadwal mingguan aktif siap dijalankan di pelacak
            </p>
          </div>
        </div>

        <a
          href="#volume-otot"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition-colors min-h-[44px]"
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          Volume Otot
        </a>
      </header>

      <ProgramView />

      <div id="volume-otot" className="scroll-mt-4">
        <VolumeChart />
      </div>
    </main>
  );
}
