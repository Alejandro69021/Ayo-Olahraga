"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  HardDrive,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Timer,
  WifiOff,
  X,
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

/** Subtle scroll-reveal wrapper */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

type DemoExerciseId = "squat" | "pushup" | "rdl" | "plank";

interface HeroExerciseDemo {
  id: DemoExerciseId;
  short: string;
  name: string;
  view: string;
  angleValue: string;
  weightKg: number;
  reps: number;
  cue: string;
  checks: string[];
}

const HERO_EXERCISES: HeroExerciseDemo[] = [
  {
    id: "squat",
    short: "Squat",
    name: "Barbell Back Squat",
    view: "Tampak Samping",
    angleValue: "92°",
    weightKg: 70,
    reps: 8,
    cue: "Paha sejajar lantai, jaga badan tetap stabil saat naik.",
    checks: ["Kedalaman paralel", "Torso stabil", "Lockout penuh"],
  },
  {
    id: "pushup",
    short: "Push-Up",
    name: "Standard Push-Up",
    view: "Tampak Samping",
    angleValue: "84°",
    weightKg: 0,
    reps: 15,
    cue: "Bahu sampai tumit lurus, tahan pinggul agar tidak turun.",
    checks: ["Garis tubuh lurus", "Kedalaman siku", "Tempo rapi"],
  },
  {
    id: "rdl",
    short: "RDL",
    name: "Romanian Deadlift",
    view: "Tampak Samping",
    angleValue: "108°",
    weightKg: 60,
    reps: 10,
    cue: "Dorong pinggul ke belakang, jaga punggung bawah netral.",
    checks: ["Hip hinge bersih", "Punggung netral", "Kunci pinggul"],
  },
  {
    id: "plank",
    short: "Plank",
    name: "Forearm Plank",
    view: "Isometrik",
    angleValue: "178°",
    weightKg: 0,
    reps: 45,
    cue: "Siku tepat di bawah bahu, tahan core dengan napas teratur.",
    checks: ["Pinggul sejajar", "Bahu stabil", "Timer aktif"],
  },
];

const MARQUEE_ITEMS = [
  `${EXERCISES_DATABASE.length} Gerakan Terkurasi`,
  `${ALL_RULESETS.length} RuleSet Kamera 2D`,
  "Program 30 Hari Otomatis",
  "Offline-First PWA",
  "Tanpa Login",
  "Peta Otot Interaktif",
  "Backup & Restore JSON",
  "Rest Timer Otomatis",
];

const PROGRAM_GOALS = ["Hipertrofi", "Kekuatan", "Fat Loss"] as const;
const PROGRAM_LEVELS = ["Pemula", "Menengah", "Lanjutan"] as const;
const PROGRAM_EQUIP = ["Full Gym", "Dumbbell", "Bodyweight"] as const;

const WORKFLOW_STEPS = [
  {
    num: "01",
    title: "Pilih alat atau buat jadwal",
    desc: "Mulai sesi bebas sesuai alat di gym, atau susun jadwal 30 hari lewat 7 pertanyaan singkat.",
  },
  {
    num: "02",
    title: "Catat set & pakai timer",
    desc: "Input beban dan repetisi cepat dengan satu tangan. Rest timer berjalan otomatis setelah set selesai.",
  },
  {
    num: "03",
    title: "Cek postur di kamera HP",
    desc: "Aktifkan Form Coach kapan saja untuk memantau kedalaman gerakan dan hitung rep secara lokal.",
  },
  {
    num: "04",
    title: "Simpan & cadangkan data",
    desc: "Semua sesi tersimpan di perangkat. Ekspor ke file JSON kapan saja kalau mau pindah HP.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Apakah video kamera diunggah ke server?",
    a: "Tidak. Deteksi pose MediaPipe dijalankan langsung di browser perangkat kamu. Video tidak direkam dan tidak pernah keluar dari HP atau laptop.",
  },
  {
    q: "Bisa dipakai kalau di gym tidak ada sinyal?",
    a: "Bisa. Ayo-Olahraga dibuat sebagai PWA offline-first. Setelah dibuka sekali atau dipasang ke layar utama, tracker, jadwal, dan riwayat tetap jalan tanpa internet.",
  },
  {
    q: "Bagaimana cara pindah HP tanpa login akun?",
    a: "Buka halaman Tracker, masuk ke menu Alat & Data, lalu pilih tab Riwayat & Backup. Unduh file JSON cadanganmu dan impor di perangkat baru.",
  },
  {
    q: "Apakah semua gerakan punya koreksi postur penuh?",
    a: "Tidak semua gerakan cocok dibaca dari satu kamera 2D. Karena itu 46 gerakan dibagi jujur ke Tier A (analisis penuh tampak samping), Tier B (tampak depan), dan Tier C (penghitung rep).",
  },
] as const;

/** Minimal clean 2D posture diagram without sci-fi clutter */
function PostureDiagram({ exerciseId, angleValue }: { exerciseId: DemoExerciseId; angleValue: string }) {
  const poses: Record<
    DemoExerciseId,
    {
      points: [number, number][];
      bones: [number, number][];
      focusJoint: [number, number];
    }
  > = {
    squat: {
      points: [
        [108, 36],
        [98, 56],
        [116, 68],
        [102, 50],
        [68, 96],
        [112, 102],
        [96, 144],
      ],
      bones: [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [4, 5],
        [5, 6],
      ],
      focusJoint: [112, 102],
    },
    pushup: {
      points: [
        [168, 86],
        [146, 94],
        [136, 118],
        [148, 138],
        [102, 104],
        [64, 118],
        [30, 134],
      ],
      bones: [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [4, 5],
        [5, 6],
      ],
      focusJoint: [136, 118],
    },
    rdl: {
      points: [
        [144, 58],
        [124, 68],
        [122, 98],
        [120, 126],
        [74, 80],
        [86, 114],
        [82, 146],
      ],
      bones: [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [4, 5],
        [5, 6],
      ],
      focusJoint: [74, 80],
    },
    plank: {
      points: [
        [166, 94],
        [144, 98],
        [144, 128],
        [162, 128],
        [98, 104],
        [58, 114],
        [28, 128],
      ],
      bones: [
        [0, 1],
        [1, 2],
        [2, 3],
        [1, 4],
        [4, 5],
        [5, 6],
      ],
      focusJoint: [98, 104],
    },
  };

  const pose = poses[exerciseId];

  return (
    <div className="relative h-40 w-full rounded-2xl bg-[#090A0C] border border-zinc-800/80 flex items-center justify-center overflow-hidden">
      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-semibold text-[#DFFF00]">
        {angleValue}
      </div>

      <svg
        viewBox="0 0 200 165"
        className="w-full h-full max-w-[220px]"
        aria-label={`Diagram postur 2D ${exerciseId}`}
      >
        <line x1="20" y1="148" x2="180" y2="148" stroke="#222328" strokeWidth="1.5" />
        <circle
          cx={pose.focusJoint[0]}
          cy={pose.focusJoint[1]}
          r="13"
          fill="rgba(223, 255, 0, 0.1)"
          stroke="#DFFF00"
          strokeWidth="1"
          strokeDasharray="3 3"
          className="transition-all duration-300"
        />
        {pose.bones.map(([a, b], idx) => (
          <line
            key={idx}
            x1={pose.points[a][0]}
            y1={pose.points[a][1]}
            x2={pose.points[b][0]}
            y2={pose.points[b][1]}
            stroke="#DFFF00"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        ))}
        {pose.points.map(([x, y], idx) => (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={idx === 0 ? 6.5 : 3.8}
            fill="#090A0C"
            stroke="#DFFF00"
            strokeWidth="2.2"
            className="transition-all duration-300"
          />
        ))}
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const [activePlan, setActivePlan] = useState<ProgramPlan | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Interactive Hero workout card state
  const [activeDemoIdx, setActiveDemoIdx] = useState(0);
  const [demoPausedUntil, setDemoPausedUntil] = useState(0);
  const [demoSetNumber, setDemoSetNumber] = useState(3);
  const [demoRestSeconds, setDemoRestSeconds] = useState(0);
  const [justLoggedSet, setJustLoggedSet] = useState(false);

  // Interactive Bento #01 split selector
  const [selectedSplit, setSelectedSplit] = useState(0);

  // Interactive Bento #02 program generator preview
  const [goalIdx, setGoalIdx] = useState(0);
  const [levelIdx, setLevelIdx] = useState(1);
  const [equipIdx, setEquipIdx] = useState(0);

  // FAQ accordion
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("exercises")) {
        window.location.replace(`/tracker${window.location.search}`);
        return;
      }
    }

    let mounted = true;
    getActivePlan()
      .then((plan) => {
        if (mounted && plan) setActivePlan(plan);
      })
      .catch(() => {});

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      mounted = false;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDemoRestSeconds((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (Date.now() < demoPausedUntil) return;
      setActiveDemoIdx((prev) => (prev + 1) % HERO_EXERCISES.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [demoPausedUntil]);

  const handleSelectDemo = (idx: number) => {
    setActiveDemoIdx(idx);
    setDemoPausedUntil(Date.now() + 15000);
  };

  const handleDemoDoneSet = () => {
    setDemoPausedUntil(Date.now() + 15000);
    setDemoSetNumber((prev) => (prev >= 4 ? 1 : prev + 1));
    setDemoRestSeconds(60);
    setJustLoggedSet(true);
    window.setTimeout(() => setJustLoggedSet(false), 1600);
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const res = await installPrompt.userChoice;
    if (res.outcome === "accepted") setInstallPrompt(null);
  };

  const activeDemo = HERO_EXERCISES[activeDemoIdx];
  const recommendedDays = levelIdx === 0 ? "3 hari/minggu" : levelIdx === 1 ? "4 hari/minggu" : "5 hari/minggu";
  const recommendedSplitName =
    levelIdx === 0 ? "Full Body" : levelIdx === 1 ? "Upper / Lower" : "Push Pull Legs";

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 selection:bg-[#DFFF00] selection:text-black overflow-x-clip">
      {/* 1. FIXED GLASSY NAVBAR */}
      <header className={`landing-navbar ${isScrolled || isMobileMenuOpen ? "is-scrolled" : ""}`}>
        <div className="landing-navbar-inner">
          <Link href="/" className="flex items-center gap-2.5 group justify-self-start">
            <div className="w-9 h-9 rounded-xl bg-[#DFFF00] text-black flex items-center justify-center">
              <BrandLogo className="w-5 h-5 stroke-[2.8]" />
            </div>
            <span className="font-metric text-xl font-black tracking-tight uppercase text-white group-hover:text-[#DFFF00] transition-colors">
              AYO-OLAHRAGA
            </span>
          </Link>

          <nav className="hidden md:flex items-center justify-center gap-7 text-sm font-medium text-zinc-400 justify-self-center">
            <a href="#fitur" className="hover:text-white transition-colors">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-white transition-colors">
              Cara Kerja
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 justify-self-end">
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstallPwa}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span>Pasang PWA</span>
              </button>
            )}
            {activePlan && (
              <Link
                href="/program"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Jadwal Aktif</span>
              </Link>
            )}
            <Link
              href="/tracker"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 h-10 rounded-full bg-[#DFFF00] hover:bg-[#e8ff4d] text-black font-metric font-black uppercase text-xs sm:text-sm tracking-wide transition-colors"
            >
              <span>Buka Tracker</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
              className="md:hidden w-11 h-11 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-900 bg-[#0A0A0A] px-4 py-4 space-y-2">
            {[
              { href: "#fitur", label: "Fitur" },
              { href: "#cara-kerja", label: "Cara Kerja" },
              { href: "#faq", label: "FAQ" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-zinc-200 hover:bg-zinc-900"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </a>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                href="/program/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-metric font-bold uppercase text-white"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span>Buat Program</span>
              </Link>
              <Link
                href={activePlan ? "/program" : "/tracker"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 h-11 rounded-xl bg-[#DFFF00] text-black text-xs font-metric font-black uppercase"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{activePlan ? "Jadwal Aktif" : "Mulai Latihan"}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="pt-[72px]">
        {/* 2. HERO SECTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Hero Left */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500">
                PWA Offline · Tracker &amp; Form Coach 2D
              </div>

              <h1 className="font-metric text-5xl sm:text-7xl lg:text-[78px] font-black uppercase leading-[0.94] tracking-tight text-white">
                CATAT SET.
                <br />
                <span className="text-[#DFFF00] italic pr-2">JAGA POSTUR.</span>
              </h1>

              <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
                Pelacak latihan gym, penyusun jadwal 30 hari, dan koreksi postur lewat kamera HP. Langsung
                pakai di browser tanpa bikin akun dan tetap berjalan saat sinyal di gym hilang.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/tracker"
                  className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-[#DFFF00] hover:bg-[#e8ff4d] text-black font-metric font-black uppercase text-base tracking-wide transition-colors"
                >
                  <span>Mulai Latihan</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.8]" />
                </Link>
                <Link
                  href="/program/new"
                  className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-2xl border border-zinc-800 bg-[#111214] hover:border-zinc-700 text-white font-metric font-bold uppercase text-sm tracking-wide transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#DFFF00]" />
                  <span>Susun Program 30 Hari</span>
                </Link>
              </div>

              <div className="pt-5 border-t border-zinc-900 grid grid-cols-3 gap-4 max-w-md">
                <div>
                  <div className="font-metric text-3xl font-black text-white leading-none">
                    {EXERCISES_DATABASE.length}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-1.5">
                    Gerakan
                  </div>
                </div>
                <div>
                  <div className="font-metric text-3xl font-black text-[#DFFF00] leading-none">
                    {ALL_RULESETS.length}
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-1.5">
                    RuleSet 2D
                  </div>
                </div>
                <div>
                  <div className="font-metric text-3xl font-black text-white leading-none">
                    100%
                  </div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-1.5">
                    Lokal di HP
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right: Grounded Interactive Workout Card */}
            <div className="lg:col-span-6">
              <div className="rounded-[26px] border border-zinc-800 bg-[#101114] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#DFFF00]">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-metric text-lg font-bold uppercase text-white leading-tight">
                        {activeDemo.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{activeDemo.view}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    Pratinjau
                  </span>
                </div>

                {/* Exercise Switcher */}
                <div className="grid grid-cols-4 gap-1.5 my-3.5">
                  {HERO_EXERCISES.map((ex, idx) => {
                    const active = idx === activeDemoIdx;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => handleSelectDemo(idx)}
                        className={`h-9 rounded-xl text-xs font-metric font-bold uppercase tracking-wide transition-colors ${
                          active
                            ? "bg-[#DFFF00] text-black"
                            : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800/80"
                        }`}
                      >
                        {ex.short}
                      </button>
                    );
                  })}
                </div>

                <PostureDiagram exerciseId={activeDemo.id} angleValue={activeDemo.angleValue} />

                <div className="mt-3 p-3 rounded-2xl bg-[#0A0B0D] border border-zinc-800/80 space-y-2">
                  <p className="text-xs text-zinc-300 leading-relaxed">{activeDemo.cue}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDemo.checks.map((chk) => (
                      <span
                        key={chk}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                      >
                        <Check className="w-3 h-3 text-[#DFFF00]" />
                        {chk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/70">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">SET</div>
                    <div className="font-metric text-xl font-black text-white">
                      {demoSetNumber}
                      <span className="text-zinc-500 text-sm">/4</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/70">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">
                      {activeDemo.id === "plank" ? "DETIK" : "REPS"}
                    </div>
                    <div className="font-metric text-xl font-black text-white">{activeDemo.reps}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/70">
                    <div className="text-[10px] font-mono text-zinc-500 uppercase">BEBAN</div>
                    <div className="font-metric text-xl font-black text-[#DFFF00]">
                      {activeDemo.weightKg > 0 ? `${activeDemo.weightKg} KG` : "BW"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDemoDoneSet}
                  className={`mt-3 w-full h-11 rounded-xl font-metric font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors ${
                    justLoggedSet
                      ? "bg-emerald-400 text-black"
                      : "bg-[#DFFF00] hover:bg-[#e8ff4d] text-black"
                  }`}
                >
                  {justLoggedSet ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Set Tercatat · Rest {demoRestSeconds}d</span>
                    </>
                  ) : demoRestSeconds > 0 ? (
                    <>
                      <Timer className="w-4 h-4 stroke-[2.5]" />
                      <span>Istirahat {demoRestSeconds}d · Set Berikutnya</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.8]" />
                      <span>Coba Tandai Set Selesai</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CLEAN MARQUEE STRIP */}
        <section
          aria-label="Ringkasan fitur"
          className="border-y border-zinc-900 bg-[#0B0C0E] py-3.5 overflow-hidden select-none"
        >
          <div className="animate-marquee flex items-center gap-8">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
              <div key={idx} className="flex items-center gap-8 shrink-0">
                <span className="font-metric text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-300">
                  {item}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#DFFF00]" />
              </div>
            ))}
          </div>
        </section>

        {/* 4. FOCUSED 5-CARD BENTO GRID (#fitur) */}
        <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end mb-10 sm:mb-14">
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500">
                  FITUR UTAMA
                </div>
                <h2 className="font-metric text-4xl sm:text-5xl font-black uppercase leading-[0.96] text-white">
                  Fokus ke latihan,
                  <br />
                  <span className="text-[#DFFF00] italic">bukan ngurus aplikasi.</span>
                </h2>
              </div>
              <p className="lg:col-span-5 text-sm sm:text-base text-zinc-400 leading-relaxed">
                Dari pilih alat sampai catat progres mingguan, semuanya disusun ringkas agar tetap nyaman
                dipakai di sela-sela waktu istirahat set.
              </p>
            </div>
          </Reveal>

          {/* Row 1: 7 + 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
            {/* 01 / Tracker & Split */}
            <Reveal className="lg:col-span-7">
              <div className="h-full rounded-[24px] border border-zinc-800 hover:border-zinc-700 bg-[#101114] p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all duration-300 ease-out hover:-translate-y-1.5">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                    01 / TRACKER LATIHAN
                  </div>
                  <h3 className="font-metric text-2xl sm:text-3xl font-black uppercase text-white">
                    Pilih alat, pilih otot, langsung mulai.
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2 max-w-lg leading-relaxed">
                    Tombol beban dan repetisi dibuat besar untuk satu tangan, dilengkapi timer istirahat
                    otomatis serta saran kenaikan beban dari sesi terakhir.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { name: "FULL BODY", sub: "3 hari · Pemula", sets: "18 set" },
                    { name: "UPPER / LOWER", sub: "4 hari · Seimbang", sets: "20 set" },
                    { name: "PUSH PULL LEGS", sub: "5 hari · Volume", sets: "22 set" },
                  ].map((split, idx) => {
                    const active = selectedSplit === idx;
                    return (
                      <button
                        key={split.name}
                        type="button"
                        onClick={() => setSelectedSplit(idx)}
                        className={`text-left p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                          active
                            ? "bg-[#DFFF00] text-black border-[#DFFF00]"
                            : "bg-[#0A0B0D] text-zinc-200 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className={`text-[10px] font-mono uppercase ${active ? "text-black/70" : "text-zinc-500"}`}>
                          {split.sets}
                        </div>
                        <div className="font-metric text-lg font-black uppercase mt-1">{split.name}</div>
                        <div className={`text-xs mt-0.5 ${active ? "text-black/80" : "text-zinc-400"}`}>
                          {split.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* 02 / Solid Volt Program Generator */}
            <Reveal delay={60} className="lg:col-span-5">
              <div className="h-full rounded-[24px] bg-[#DFFF00] text-black p-6 sm:p-7 flex flex-col justify-between gap-5 transition-transform duration-300 ease-out hover:-translate-y-1.5">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-black/60 mb-2">
                    02 / PROGRAM 30 HARI
                  </div>
                  <h3 className="font-metric text-2xl sm:text-3xl font-black uppercase leading-tight text-black">
                    Susun jadwal otomatis dalam 7 langkah.
                  </h3>
                  <p className="text-sm text-black/75 mt-2 leading-relaxed">
                    Menyesuaikan alat yang kamu punya, otot prioritas, keluhan sendi, dan minggu Deload.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setGoalIdx((i) => (i + 1) % PROGRAM_GOALS.length)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/10 hover:bg-black/15 border border-black/15 text-xs font-mono"
                  >
                    <span className="text-black/65">Tujuan</span>
                    <span className="font-bold text-black">{PROGRAM_GOALS[goalIdx]} ↻</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevelIdx((i) => (i + 1) % PROGRAM_LEVELS.length)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/10 hover:bg-black/15 border border-black/15 text-xs font-mono"
                  >
                    <span className="text-black/65">Level</span>
                    <span className="font-bold text-black">{PROGRAM_LEVELS[levelIdx]} ↻</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEquipIdx((i) => (i + 1) % PROGRAM_EQUIP.length)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/10 hover:bg-black/15 border border-black/15 text-xs font-mono"
                  >
                    <span className="text-black/65">Alat</span>
                    <span className="font-bold text-black">{PROGRAM_EQUIP[equipIdx]} ↻</span>
                  </button>

                  <Link
                    href="/program/new"
                    className="mt-2 w-full flex items-center justify-between px-4 h-11 rounded-xl bg-[#080808] hover:bg-zinc-900 text-[#DFFF00] font-mono text-xs font-bold transition-colors"
                  >
                    <span>
                      {recommendedSplitName} · {recommendedDays}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Row 2: 3 Clean Cards (Kamera 2D, Volume Otot, Offline & Backup) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 03 / Kamera 2D Jujur (Tier A/B/C) */}
            <Reveal>
              <div className="h-full rounded-[24px] border border-zinc-800 hover:border-zinc-700 bg-[#101114] p-6 flex flex-col justify-between gap-5 transition-all duration-300 ease-out hover:-translate-y-1.5">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                    03 / FORM COACH 2D
                  </div>
                  <h3 className="font-metric text-2xl font-black uppercase text-white">
                    Koreksi postur lokal tanpa upload video.
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                    Berjalan via MediaPipe di perangkatmu dengan pembagian akurasi yang jelas:
                  </p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0A0B0D] border border-zinc-800/80">
                    <span className="font-mono font-bold text-[#DFFF00]">TIER A</span>
                    <span className="text-zinc-300">Squat, Push-Up, RDL, Plank</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0A0B0D] border border-zinc-800/80">
                    <span className="font-mono font-bold text-emerald-400">TIER B</span>
                    <span className="text-zinc-300">Curl, Press, Row, Pull-Up</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0A0B0D] border border-zinc-800/80">
                    <span className="font-mono font-bold text-zinc-400">TIER C</span>
                    <span className="text-zinc-300">Penghitung rep &amp; tempo</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* 04 / Volume Otot */}
            <Reveal delay={60}>
              <div className="group h-full rounded-[24px] border border-zinc-800 hover:border-zinc-700 bg-[#101114] p-6 flex flex-col justify-between gap-5 transition-all duration-300 ease-out hover:-translate-y-1.5">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                    04 / ANATOMI &amp; VOLUME
                  </div>
                  <h3 className="font-metric text-2xl font-black uppercase text-white">
                    Pantau set mingguan tiap otot.
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                    Hitung otomatis set efektif 7 hari terakhir dibanding target program, plus kalkulator BMI
                    dan TDEE.
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-2 h-24 p-3 rounded-xl bg-[#0A0B0D] border border-zinc-800/80">
                  {[
                    { label: "Dada", h: "68%", accent: false, delay: "0ms" },
                    { label: "Pung", h: "82%", accent: false, delay: "70ms" },
                    { label: "Kaki", h: "60%", accent: false, delay: "140ms" },
                    { label: "Bahu", h: "76%", accent: false, delay: "210ms" },
                    { label: "Lengan", h: "92%", accent: true, delay: "280ms" },
                  ].map((bar) => (
                    <div key={bar.label} className="flex flex-col items-center gap-1.5 h-full">
                      <div className="w-full flex-1 rounded-t-md bg-zinc-900/90 flex items-end overflow-hidden">
                        <div
                          style={{ height: bar.h, animationDelay: bar.delay }}
                          className={`w-full rounded-t-md animate-bar-rise origin-bottom transition-transform duration-300 ease-out group-hover:scale-y-110 ${
                            bar.accent
                              ? "bg-[#DFFF00]"
                              : "bg-zinc-700 group-hover:bg-[#DFFF00]/80"
                          }`}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* 05 / Offline & Backup */}
            <Reveal delay={120}>
              <div className="h-full rounded-[24px] border border-zinc-800 hover:border-zinc-700 bg-[#101114] p-6 flex flex-col justify-between gap-5 transition-all duration-300 ease-out hover:-translate-y-1.5">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                    05 / OFFLINE &amp; BACKUP
                  </div>
                  <h3 className="font-metric text-2xl font-black uppercase text-white">
                    Data milikmu, bukan di cloud orang lain.
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                    Tersimpan di perangkat secara offline. Mau ganti HP? Ekspor dan pulihkan semua riwayat
                    dalam satu file JSON.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-[#0A0B0D] border border-zinc-800/80 flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-[#DFFF00] shrink-0" />
                    <span className="text-[11px] font-mono text-zinc-300">Offline PWA</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A0B0D] border border-zinc-800/80 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-mono text-zinc-300">Backup JSON</span>
                  </div>
                  <div className="col-span-2 p-2.5 rounded-xl bg-[#0A0B0D] border border-zinc-800/80 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="text-[11px] text-zinc-400">Tanpa registrasi &amp; tanpa iklan</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 5. CARA KERJA RINGKAS (#cara-kerja) */}
        <section id="cara-kerja" className="border-y border-zinc-900 bg-[#0B0C0E] py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="mb-10">
                <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  ALUR PAKAI
                </div>
                <h2 className="font-metric text-3xl sm:text-4xl font-black uppercase text-white">
                  Empat langkah langsung jalan.
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {WORKFLOW_STEPS.map((s) => (
                  <div
                    key={s.num}
                    className="rounded-2xl border border-zinc-800/80 hover:border-zinc-700 bg-[#101114] p-5 space-y-2.5 transition-all duration-300 ease-out hover:-translate-y-1.5"
                  >
                    <div className="font-mono text-xs font-bold text-[#DFFF00]">{s.num}</div>
                    <h3 className="font-metric text-xl font-bold uppercase text-white">{s.title}</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* 6. FAQ RINGKAS (#faq) */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <Reveal>
            <div className="mb-8">
              <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500 mb-2">
                FAQ
              </div>
              <h2 className="font-metric text-3xl sm:text-4xl font-black uppercase text-white">
                Pertanyaan yang sering muncul.
              </h2>
            </div>

            <div className="space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={item.q}
                    className={`rounded-2xl border transition-colors ${
                      isOpen ? "border-zinc-700 bg-[#111216]" : "border-zinc-800/90 bg-[#0D0E11]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full min-h-[54px] px-5 py-4 flex items-center justify-between gap-4 text-left"
                    >
                      <span className="text-sm sm:text-base font-semibold text-white">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[#DFFF00] transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        </section>

        {/* 7. SOLID VOLT FINAL CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <Reveal>
            <div className="rounded-[28px] bg-[#DFFF00] text-black p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-black/60">
                  BROWSER &amp; PWA
                </div>
                <h2 className="font-metric text-4xl sm:text-6xl font-black uppercase leading-[0.94] text-black">
                  Siap latihan
                  <br />
                  hari ini?
                </h2>
                <p className="text-sm sm:text-base text-black/75 max-w-md leading-relaxed">
                  Langsung buka tracker atau susun program 30 harimu. Gratis tanpa akun.
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3">
                <Link
                  href="/tracker"
                  className="group w-full h-13 py-3.5 px-6 rounded-2xl bg-[#080808] hover:bg-zinc-900 text-white flex items-center justify-between transition-colors"
                >
                  <span className="font-metric text-lg font-black uppercase tracking-wide">
                    Buka Tracker Latihan
                  </span>
                  <ArrowRight className="w-5 h-5 text-[#DFFF00] group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  href="/program/new"
                  className="group w-full h-13 py-3.5 px-6 rounded-2xl bg-[#080808] hover:bg-zinc-900 text-white flex items-center justify-between transition-colors"
                >
                  <span className="font-metric text-lg font-black uppercase tracking-wide">
                    Susun Program 30 Hari
                  </span>
                  <ArrowRight className="w-5 h-5 text-[#DFFF00] group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {activePlan && (
                  <Link
                    href="/program"
                    className="group w-full h-11 px-6 rounded-2xl border border-black/30 hover:border-black text-black flex items-center justify-between transition-colors"
                  >
                    <span className="text-sm font-metric font-black uppercase">Buka Jadwal Aktif</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* 8. FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#060607]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#DFFF00] text-black flex items-center justify-center">
                <BrandLogo className="w-4 h-4 stroke-[2.8]" />
              </div>
              <span className="font-metric text-base font-black uppercase text-white">AYO-OLAHRAGA</span>
            </div>
            <p className="text-xs text-zinc-500">
              Offline-first gym tracker &amp; 2D Form Coach lokal di browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-400">
            <Link href="/tracker" className="hover:text-white transition-colors">
              Tracker
            </Link>
            <Link href="/program/new" className="hover:text-white transition-colors">
              Buat Program
            </Link>
            <Link href="/program" className="hover:text-white transition-colors">
              Jadwal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
