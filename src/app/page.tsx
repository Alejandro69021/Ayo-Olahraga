"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Dumbbell,
  Flame,
  HardDrive,
  Menu,
  ShieldCheck,
  Sparkles,
  Timer,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/icons/EquipmentIcons";
import { EXERCISES_DATABASE } from "@/data/exercises";
import { ALL_RULESETS } from "@/lib/pose/rules/config";
import { getActivePlan } from "@/lib/program/storage";
import type { ProgramPlan } from "@/lib/program/program-types";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const FEATURE_PILLARS = [
  {
    num: "01",
    tag: "AI FORM COACH",
    title: "Koreksi Postur Real-Time Langsung di Kamera",
    desc: "Deteksi sudut sendi 2D dan hitung repetisi otomatis memakai MediaPipe WebAssembly langsung di browser. Tanpa rekaman video dikirim ke server.",
    bullets: [
      `${EXERCISES_DATABASE.length} gerakan terkurasi (${ALL_RULESETS.length} RuleSet aktif)`,
      "PoseGate otomatis: validasi framing sebelum hitung rep",
      "Panduan suara Bahasa Indonesia opsional & skor per repetisi",
    ],
    accent: "text-[#DFFF00]",
    borderHover: "hover:border-[#DFFF00]/40",
    ctaHref: "/tracker",
    ctaLabel: "Coba di Tracker",
  },
  {
    num: "02",
    tag: "PROGRAM BUILDER",
    title: "Jadwal Latihan Mingguan Tersusun dalam 7 Langkah",
    desc: "Pilih tujuan, pengalaman, hari latihan, alat yang tersedia, otot prioritas, dan keluhan sendi. Sistem menyusun jadwal mesosiklus lengkap dengan target set, rep, dan RIR.",
    bullets: [
      "Otomatis menghindari gerakan berisiko pada sendi tertentu",
      "Minggu Deload terintegrasi untuk pemulihan optimal",
      "1 klik 'Mulai sesi' langsung masuk ke Tracker",
    ],
    accent: "text-emerald-400",
    borderHover: "hover:border-emerald-400/40",
    ctaHref: "/program/new",
    ctaLabel: "Susun Program",
  },
  {
    num: "03",
    tag: "LIVE GYM TRACKER",
    title: "Catat Set, Beban, dan Progressive Overload Tanpa Ribet",
    desc: "Dirancang untuk dipakai dengan satu tangan di antara set. Timer istirahat otomatis berjalan dan rekomendasi kenaikan beban muncul dari riwayat sesi sebelumnya.",
    bullets: [
      "Stepper beban & repetisi cepat (+2,5 kg / +5 kg)",
      "Rest timer melayang + tombol +30 detik",
      "Riwayat sesi lokal + backup/restore JSON kapan saja",
    ],
    accent: "text-[#DFFF00]",
    borderHover: "hover:border-[#DFFF00]/40",
    ctaHref: "/tracker",
    ctaLabel: "Buka Pelacak",
  },
  {
    num: "04",
    tag: "ANATOMI & VOLUME",
    title: "Peta Otot Interaktif & Grafik Set Mingguan",
    desc: "Pantau distribusi set efektif 7 hari terakhir (otot utama 1 set, pendukung 0,5 set) dibanding target rencana agar tidak ada kelompok otot yang tertinggal.",
    bullets: [
      "Body Anatomy Heatmap depan & belakang",
      "Perbandingan volume aktual vs target per minggu",
      "Kalkulator BMI, BMR/TDEE, dan database makanan Indonesia",
    ],
    accent: "text-emerald-400",
    borderHover: "hover:border-emerald-400/40",
    ctaHref: "/program",
    ctaLabel: "Lihat Volume Otot",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Pilih Alat atau Susun Program",
    desc: "Mulai latihan bebas berdasarkan alat & otot, atau jawab 7 pertanyaan singkat untuk jadwal 4–5 minggu otomatis.",
  },
  {
    step: "02",
    title: "Latihan dengan Tracker & AI Kamera",
    desc: "Tandai set selesai, pakai timer istirahat otomatis, dan nyalakan AI Form Coach kapan pun ingin cek kedalaman atau postur.",
  },
  {
    step: "03",
    title: "Pantau Volume & Progressive Overload",
    desc: "Setiap set tersimpan offline di perangkat Anda. Sesi berikutnya langsung memberi saran beban dan progres volume mingguan.",
  },
] as const;

const SHOWCASE_EXERCISES = [
  {
    id: "squat",
    name: "Barbell Back Squat",
    equipment: "Barbell",
    view: "Tampak Samping",
    target: "Target: 3 × 8–10 rep • RIR 2",
    metric: "Sudut Lutut & Batang Tubuh 2D",
    cues: [
      "Kedalaman paha sejajar lantai (< 110°)",
      "Kemiringan batang tubuh terkontrol (≤ 60°)",
      "Tumit tetap menapak penuh di lantai",
    ],
    score: 94,
    activeCue: "Kedalaman paha sejajar ✓",
  },
  {
    id: "pushup",
    name: "Standard Push-Up",
    equipment: "Bodyweight",
    view: "Tampak Samping",
    target: "Target: 3 × 10–15 rep • RIR 2",
    metric: "Sudut Siku & Garis Bahu–Pinggul–Kaki",
    cues: [
      "Tekukan siku bawah mencapai ~90° (≤ 100°)",
      "Pinggul tidak melorot (anti hip-sag)",
      "Lengan lurus penuh di puncak (lockout ≥ 160°)",
    ],
    score: 92,
    activeCue: "Garis tubuh lurus stabil ✓",
  },
  {
    id: "rdl",
    name: "Romanian Deadlift",
    equipment: "Barbell / Dumbbell",
    view: "Tampak Samping",
    target: "Target: 3 × 8–12 rep • RIR 2",
    metric: "Engsel Pinggul 2D (Bahu–Pinggul–Lutut)",
    cues: [
      "Pola hip-hinge murni, lutut tidak menekuk jadi squat",
      "Pinggul & bahu naik bersamaan (anti hip-shoot)",
      "Kunci pinggul tegak tanpa condong berlebihan ke belakang",
    ],
    score: 91,
    activeCue: "Engsel pinggul terkontrol ✓",
  },
  {
    id: "plank",
    name: "Forearm Plank",
    equipment: "Bodyweight (Hold)",
    view: "Tampak Samping",
    target: "Target: 3 × 30–60 detik • RIR 2",
    metric: "Durasi Hold Bersih vs Total",
    cues: [
      "Siku sejajar tepat di bawah bahu",
      "Pinggul tidak turun atau terangkat terlalu tinggi",
      "Waktu bersih hanya dihitung saat postur lurus valid",
    ],
    score: 96,
    activeCue: "Postur isometrik bersih ✓",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Apakah kamera AI Form Coach merekam atau mengirim video saya ke server?",
    a: "Tidak sama sekali. Model MediaPipe PoseLandmarker berjalan 100% lokal di dalam browser perangkat Anda menggunakan WebAssembly. Hanya angka ringkasan repetisi dan skor form yang disimpan di penyimpanan lokal perangkat.",
  },
  {
    q: "Apakah aplikasi ini tetap bisa dipakai saat tidak ada sinyal internet di gym?",
    a: "Bisa. Ayo-Olahraga dirancang sebagai Offline-First PWA. Setelah halaman dan model dimuat pertama kali, pencatatan set, timer istirahat, jadwal program, hingga AI Form Coach tetap berjalan penuh tanpa internet.",
  },
  {
    q: "Bagaimana cara mengamankan data latihan saya kalau ingin ganti HP atau browser?",
    a: "Di halaman Tracker (tab Alat & Nutrisi → Riwayat & Backup), Anda bisa mengekspor seluruh riwayat latihan dan jadwal program ke file JSON dalam 1 klik, lalu mengimpornya kembali kapan saja di perangkat baru tanpa perlu akun.",
  },
  {
    q: "Seberapa akurat koreksi sudut sendi dari kamera HP?",
    a: "Deteksi satu kamera 2D menggunakan ambang heuristik dengan toleransi ±10–15° dan gerbang validasi posisi (PoseGate) untuk menyaring getaran sensor. Fitur ini dirancang sebagai panduan teknik latihan mandiri, bukan pengganti diagnosis medis atau pelatih fisik langsung.",
  },
] as const;

const RIBBON_ITEMS = [
  "AI FORM COACH 100% LOKAL",
  "46 GERAKAN TERKURASI",
  "PROGRAM BUILDER 7 LANGKAH",
  "HEATMAP ANATOMI OTOT",
  "OFFLINE-FIRST PWA",
  "BACKUP & RESTORE JSON",
  "TANPA LOGIN WAJIB",
];

export default function LandingPage() {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<ProgramPlan | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedShowcaseId, setSelectedShowcaseId] = useState<string>(SHOWCASE_EXERCISES[0].id);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [isUserInteractingShowcase, setIsUserInteractingShowcase] = useState(false);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedShowcase =
    SHOWCASE_EXERCISES.find((item) => item.id === selectedShowcaseId) ?? SHOWCASE_EXERCISES[0];

  useEffect(() => {
    // Redirect tautan lama /?exercises=... ke /tracker?exercises=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("exercises")) {
        router.replace(`/tracker${window.location.search}`);
        return;
      }
    }

    let cancelled = false;
    getActivePlan()
      .then((plan) => {
        if (!cancelled) setActivePlan(plan);
      })
      .catch(() => {});

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [router]);

  // Auto-cycle showcase exercises every 4.5s unless user clicked a tab recently
  useEffect(() => {
    if (isUserInteractingShowcase) return;
    const timer = setInterval(() => {
      setSelectedShowcaseId((prev) => {
        const idx = SHOWCASE_EXERCISES.findIndex((item) => item.id === prev);
        const nextIdx = (idx + 1) % SHOWCASE_EXERCISES.length;
        return SHOWCASE_EXERCISES[nextIdx].id;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [isUserInteractingShowcase]);

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectShowcase = (id: string) => {
    setSelectedShowcaseId(id);
    setIsUserInteractingShowcase(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = setTimeout(() => {
      setIsUserInteractingShowcase(false);
    }, 12000);
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setInstallPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-gray-100 flex flex-col selection:bg-[#DFFF00] selection:text-black">
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group min-h-[44px]">
            <div className="w-9 h-9 rounded-xl bg-[#DFFF00] text-black flex items-center justify-center shadow-lg shadow-[#DFFF00]/15 group-hover:scale-105 transition-transform">
              <BrandLogo className="w-5 h-5" />
            </div>
            <div className="leading-none">
              <span className="font-metric text-lg sm:text-xl font-black uppercase tracking-tight text-white block">
                AYO-OLAHRAGA
              </span>
              <span className="text-[10px] text-zinc-400 font-sans hidden sm:block">
                Industrial Fitness &amp; AI Form Coach
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
            <a href="#fitur" className="hover:text-white transition-colors py-2">
              Fitur Utama
            </a>
            <a href="#ai-showcase" className="hover:text-white transition-colors py-2">
              Demo AI Form
            </a>
            <a href="#cara-kerja" className="hover:text-white transition-colors py-2">
              Cara Kerja
            </a>
            <a href="#faq" className="hover:text-white transition-colors py-2">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {activePlan && (
              <Link
                href="/program"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-metric font-bold uppercase tracking-wider transition-colors min-h-[44px]"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jadwal</span>
              </Link>
            )}
            <Link
              href="/program/new"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-metric font-bold uppercase tracking-wider transition-colors min-h-[44px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#DFFF00]" />
              <span>Buat Program</span>
            </Link>
            <Link
              href="/tracker"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#DFFF00] hover:bg-[#cbe600] text-black text-xs font-metric font-black uppercase tracking-wider shadow-lg shadow-[#DFFF00]/15 transition-all min-h-[44px]"
            >
              <span>Mulai Latihan</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>

            {/* Mobile Menu Toggle (>= 44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-[#0B0C10] px-4 py-4 space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2">
              {activePlan && (
                <Link
                  href="/program"
                  onClick={() => setMobileMenuOpen(false)}
                  className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-metric font-bold uppercase tracking-wider min-h-[44px]"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Buka Jadwal Aktif ({activePlan.name})</span>
                </Link>
              )}
              <Link
                href="/tracker"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-[#DFFF00] text-black text-xs font-metric font-black uppercase tracking-wider min-h-[44px]"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buka Tracker</span>
              </Link>
              <Link
                href="/program/new"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-metric font-bold uppercase tracking-wider min-h-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span>Buat Program</span>
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-2 hover:text-white"
              >
                Fitur Utama
              </a>
              <a
                href="#ai-showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-2 hover:text-white"
              >
                Demo AI Form
              </a>
              <a
                href="#cara-kerja"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-2 hover:text-white"
              >
                Cara Kerja
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-2 hover:text-white"
              >
                FAQ
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION (GYMLIFE + HEVY INSPIRED) */}
      <section className="relative overflow-hidden border-b border-zinc-900">
        {/* Subtle industrial ambient glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[360px] bg-[#DFFF00]/8 blur-[120px] rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative">
          {/* Left: Editorial Copy & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-metric font-bold uppercase tracking-widest text-[#DFFF00]">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline-First PWA • Tanpa Login • 100% Lokal</span>
            </div>

            <h1 className="font-metric text-4xl sm:text-6xl font-black uppercase tracking-tight leading-[0.98] text-white">
              LATIHAN LEBIH TERUKUR.{" "}
              <span className="text-[#DFFF00]">FORM LEBIH PRESISI.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed font-sans">
              Pelacak gym, penyusun program otomatis, heatmap anatomi otot, dan{" "}
              <span className="text-zinc-200 font-medium">AI Form Coach real-time di kamera</span>{" "}
              — semuanya berjalan langsung di perangkat Anda, bahkan saat di basement gym tanpa sinyal.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/tracker"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#DFFF00] hover:bg-[#cbe600] text-black font-metric font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#DFFF00]/15 transition-all active:scale-98 min-h-[48px]"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mulai Latihan Sekarang</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>

              <Link
                href={activePlan ? "/program" : "/program/new"}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-metric font-bold text-sm uppercase tracking-wider transition-colors min-h-[48px]"
              >
                {activePlan ? (
                  <>
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Buka Jadwal Saya</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#DFFF00]" />
                    <span>Susun Program (7 Langkah)</span>
                  </>
                )}
              </Link>

              {installPrompt && !installed && (
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-metric font-bold text-xs uppercase tracking-wider transition-colors min-h-[48px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Install PWA</span>
                </button>
              )}
            </div>

            {/* Honest Product Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5 pt-4 border-t border-zinc-900 max-w-lg">
              <div>
                <div className="font-metric text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {EXERCISES_DATABASE.length}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Gerakan &amp; Tutorial</div>
              </div>
              <div>
                <div className="font-metric text-2xl sm:text-3xl font-black text-[#DFFF00] tabular-nums">
                  {ALL_RULESETS.length}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">RuleSet AI Kamera</div>
              </div>
              <div>
                <div className="font-metric text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                  100%
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Offline &amp; Privat</div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Live App Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-gradient-to-b from-[#15161D] to-[#0B0C10] border border-zinc-800 p-4 sm:p-5 shadow-2xl space-y-4">
              {/* Top status bar inside mockup */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#DFFF00] animate-pulse" />
                  <span className="font-metric text-xs font-bold uppercase tracking-wider text-[#DFFF00]">
                    {selectedShowcase.view} • PoseGate Aktif
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-mono font-bold text-emerald-300">
                  30 FPS • 2D POSE
                </span>
              </div>

              {/* Quick Exercise Switcher Pills inside Preview */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {SHOWCASE_EXERCISES.map((item) => {
                  const active = item.id === selectedShowcase.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectShowcase(item.id)}
                      className={`px-2.5 py-1.5 rounded-xl font-metric text-[11px] font-bold uppercase tracking-wider shrink-0 transition-all min-h-[36px] ${
                        active
                          ? "bg-[#DFFF00] text-black shadow-md shadow-[#DFFF00]/20"
                          : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                      }`}
                    >
                      {item.name.split(" ").slice(-2).join(" ")}
                    </button>
                  );
                })}
              </div>

              {/* Active Exercise Preview */}
              <div className="rounded-2xl bg-[#0F1016] border border-zinc-800 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-metric uppercase tracking-wider text-zinc-400">
                      {selectedShowcase.equipment} • {selectedShowcase.metric}
                    </div>
                    <div className="font-metric text-lg font-black uppercase text-white">
                      {selectedShowcase.name}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      {selectedShowcase.target}
                    </div>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#DFFF00]/10 border border-[#DFFF00]/30 text-right shrink-0">
                    <div className="text-[9px] font-bold uppercase text-zinc-400">Skor Form</div>
                    <div className="font-metric text-xl font-black text-[#DFFF00] leading-none">
                      {selectedShowcase.score}
                    </div>
                  </div>
                </div>

                {/* Biomechanical Check List for Selected Exercise */}
                <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                  {selectedShowcase.cues.map((cue) => (
                    <div
                      key={cue}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800/90 text-xs text-zinc-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{cue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini AI Cue + Volume Strip */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl bg-[#0F1016] border border-zinc-800 p-3 flex items-start gap-2">
                  <Camera className="w-4 h-4 text-[#DFFF00] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-metric font-bold uppercase text-zinc-400">
                      Pil Koreksi Aktif
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5 truncate">
                      {selectedShowcase.activeCue}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#0F1016] border border-zinc-800 p-3 flex items-start gap-2">
                  <Timer className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-metric font-bold uppercase text-zinc-400">
                      Rest Timer
                    </div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">
                      01:30 otomatis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE RIBBON */}
      <div className="bg-[#0D0E13] border-b border-zinc-900 py-3 overflow-x-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 whitespace-nowrap">
          {RIBBON_ITEMS.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 text-[11px] font-metric font-bold uppercase tracking-widest text-zinc-400"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF00]" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* 4. NUMBERED FEATURE PILLARS (01 - 04) */}
      <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 space-y-10">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-metric font-black uppercase tracking-widest text-[#DFFF00]">
            SEMUA YANG ANDA BUTUHKAN DI GYM
          </span>
          <h2 className="font-metric text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
            BUKAN SEKADAR CATATAN SET BIASA.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Dari penyusunan jadwal mingguan sampai evaluasi sudut sendi real-time lewat kamera HP — semuanya terintegrasi dalam satu PWA ringan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURE_PILLARS.map((pillar) => (
            <article
              key={pillar.num}
              className={`rounded-3xl bg-[#0F1016] border border-zinc-800/90 ${pillar.borderHover} p-6 flex flex-col justify-between gap-5 transition-colors`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-metric text-xs font-black uppercase tracking-widest ${pillar.accent}`}>
                    {pillar.num} / {pillar.tag}
                  </span>
                  <Dumbbell className="w-4 h-4 text-zinc-600" />
                </div>
                <h3 className="font-metric text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {pillar.desc}
                </p>
                <ul className="space-y-2 pt-1">
                  {pillar.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-[#DFFF00] shrink-0 mt-0.5 stroke-[3]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Link
                  href={pillar.ctaHref}
                  className="inline-flex items-center gap-1.5 text-xs font-metric font-bold uppercase tracking-wider text-white hover:text-[#DFFF00] transition-colors py-1"
                >
                  <span>{pillar.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. AI FORM COACH MATRIX HIGHLIGHT */}
      <section id="ai-showcase" className="border-t border-zinc-900 bg-[#0A0B0F]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="text-[11px] font-metric font-black uppercase tracking-widest text-[#DFFF00]">
                TRANSPARANSI BIOMEKANIKA 2D
              </span>
              <h2 className="font-metric text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                APA YANG DINILAI OLEH KAMERA AI?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Setiap gerakan dikelompokkan secara jujur berdasarkan kelayakan sudut pandang kamera tunggal 2D — lengkap dengan filter histeresis dan PoseGate agar tidak menghitung repetisi palsu.
              </p>
            </div>
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-metric font-bold uppercase tracking-wider text-white transition-colors self-start md:self-auto min-h-[44px]"
            >
              <Camera className="w-3.5 h-3.5 text-[#DFFF00]" />
              <span>Buka Kamera Form Coach</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#101218] border border-zinc-800 p-5 space-y-2.5">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#DFFF00]/15 border border-[#DFFF00]/30 font-metric text-xs font-black text-[#DFFF00]">
                TIER A • SUDUT SAGITAL ANDAL
              </span>
              <h3 className="font-metric text-lg font-extrabold uppercase text-white">
                Squat, Hinge, Push-Up, Plank, Lunge
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sudut lutut, engsel pinggul, kemiringan batang tubuh, ekstensi siku, hingga posisi tumit terbaca jelas dari samping dan dinilai 0–100 per repetisi.
              </p>
            </div>
            <div className="rounded-2xl bg-[#101218] border border-zinc-800 p-5 space-y-2.5">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 font-metric text-xs font-black text-emerald-300">
                TIER B • EVALUASI TERFOKUS
              </span>
              <h3 className="font-metric text-lg font-extrabold uppercase text-white">
                Overhead Press, Row, Pull-Up, Curl, Dips
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Menilai rentang gerak utama (lockout siku, dagu melewati palang, stabilitas siku &amp; bahu) sambil mengabaikan aspek 3D yang rawan oklusi kamera.
              </p>
            </div>
            <div className="rounded-2xl bg-[#101218] border border-zinc-800 p-5 space-y-2.5">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 font-metric text-xs font-black text-amber-300">
                TIER C • PENGHITUNG REP &amp; PERINGATAN
              </span>
              <h3 className="font-metric text-lg font-extrabold uppercase text-white">
                Bench Press, Russian Twist, G2OH
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Fokus menghitung repetisi dan memberi peringatan postur dasar (seperti simetri dorongan atau pinggul terangkat) tanpa skor presisi semu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CARA KERJA (3 LANGKAH) */}
      <section id="cara-kerja" className="border-y border-zinc-900 bg-[#0B0C10]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[11px] font-metric font-black uppercase tracking-widest text-emerald-400">
              ALUR CEPAT &amp; PRAKTIS
            </span>
            <h2 className="font-metric text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              MULAI DALAM HITUNGAN DETIK
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl bg-[#111218] border border-zinc-800 p-5 space-y-3"
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#DFFF00]/10 border border-[#DFFF00]/30 font-metric text-sm font-black text-[#DFFF00]">
                  {item.step}
                </span>
                <h3 className="font-metric text-lg font-extrabold uppercase text-white">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. OFFLINE PWA & PRIVACY CALLOUT */}
      <section id="offline-privasi" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-[#12141C] via-[#0E1116] to-[#111510] border border-zinc-800 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#DFFF00]" />
            <h3 className="font-metric text-lg font-extrabold uppercase text-white">
              Kamera 100% Privat
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Model AI PoseLandmarker dijalankan lokal via WebAssembly di browser Anda. Tidak ada foto atau video yang diunggah ke server.
            </p>
          </div>
          <div className="space-y-2">
            <HardDrive className="w-6 h-6 text-emerald-400" />
            <h3 className="font-metric text-lg font-extrabold uppercase text-white">
              Data Milik Perangkat Anda
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Jadwal program dan riwayat set tersimpan di IndexedDB perangkat. Bisa langsung dipakai tanpa buat akun, diekspor ke JSON, atau dihapus kapan saja.
            </p>
          </div>
          <div className="space-y-2">
            <BarChart3 className="w-6 h-6 text-[#DFFF00]" />
            <h3 className="font-metric text-lg font-extrabold uppercase text-white">
              Siap Tanpa Sinyal (PWA)
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pasang ke layar utama HP Anda seperti aplikasi native. Tetap lancar dipakai melacak latihan di ruang gym tanpa koneksi internet.
            </p>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 w-full space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-metric font-black uppercase tracking-widest text-[#DFFF00]">
            PERTANYAAN UMUM
          </span>
          <h2 className="font-metric text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            YANG SERING DITANYAKAN
          </h2>
        </div>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={item.q}
                className="rounded-2xl bg-[#0F1016] border border-zinc-800/90 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-900/60 transition-colors min-h-[52px]"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#DFFF00]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. FINAL CTA BANNER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 w-full">
        <div className="rounded-3xl bg-[#DFFF00] text-black p-7 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl shadow-[#DFFF00]/10">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-metric font-black uppercase tracking-widest text-black/75">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>SIAP LATIHAN HARI INI?</span>
            </div>
            <h2 className="font-metric text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
              BUKA TRACKER &amp; MULAI SET PERTAMA ANDA.
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/tracker"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-black hover:bg-zinc-900 text-[#DFFF00] font-metric font-black text-sm uppercase tracking-wider transition-colors min-h-[48px]"
            >
              <span>Buka Tracker</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/program/new"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-black/10 hover:bg-black/20 border border-black/20 text-black font-metric font-extrabold text-sm uppercase tracking-wider transition-colors min-h-[48px]"
            >
              <span>Buat Program</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-zinc-900 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-metric font-bold uppercase text-zinc-300">AYO-OLAHRAGA</span>
            <span>•</span>
            <span>Offline-First Fitness Tracker &amp; AI Form Coach</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/tracker" className="hover:text-white transition-colors py-1">
              Tracker
            </Link>
            <Link href="/program" className="hover:text-white transition-colors py-1">
              Jadwal Program
            </Link>
            <Link href="/program/new" className="hover:text-white transition-colors py-1">
              Buat Program
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
