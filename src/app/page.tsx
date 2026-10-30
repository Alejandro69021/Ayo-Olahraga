"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Play,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Shuffle,
  Trash2,
  GripVertical,
  Video,
  Check,
  RotateCcw,
  Clock,
  Trophy,
  Scale,
  Utensils,
  Flame,
  Plus,
  Minus,
  ArrowRight,
  Wifi,
  WifiOff,
  Dumbbell
} from "lucide-react";
import { BodyAnatomyMap, ExerciseAttributeValueEnum, MUSCLE_GROUPS } from "@/components/BodyAnatomyMap";
import { TutorialModal } from "@/components/TutorialModal";
import { WorkoutSummaryModal } from "@/components/WorkoutSummaryModal";
import { FitnessTools } from "@/components/FitnessTools";
import { LeaderboardModal } from "@/components/LeaderboardModal";
import {
  BarbellIcon,
  DumbbellIcon,
  BodyweightIcon,
  KettlebellIcon,
  PlateIcon,
  BrandLogo
} from "@/components/icons/EquipmentIcons";
import { EXERCISES_DATABASE, ExerciseDetail } from "@/data/exercises";
import {
  saveWorkoutSessionOffline,
  getAllSessionsOffline,
  syncPendingWorkouts,
  getRecommendedWeightAndReps,
  WorkoutSessionPayload
} from "@/lib/offline-storage";

export default function HomePage() {
  // Navigation / View Tabs: 'builder' | 'tools'
  const [activeTab, setActiveTab] = useState<"builder" | "tools">("builder");

  // Stepper: 1 = Equipment, 2 = Muscles, 3 = Exercises Selection, 4 = Live Gym Tracker
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Modals
  const [tutorialExercise, setTutorialExercise] = useState<ExerciseDetail | null>(null);
  const [summarySession, setSummarySession] = useState<WorkoutSessionPayload | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);

  // Offline / Online state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineSessions, setOfflineSessions] = useState<WorkoutSessionPayload[]>([]);

  // Step 1: Equipment Selection
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([
    "barbell",
    "dumbbell",
    "bodyweight",
    "kettlebell",
    "plate",
  ]);

  // Step 2: Muscles Selection
  const [selectedMuscles, setSelectedMuscles] = useState<ExerciseAttributeValueEnum[]>([
    ExerciseAttributeValueEnum.CHEST,
  ]);

  // Step 3: Selected Routine Exercises
  const [selectedWorkoutList, setSelectedWorkoutList] = useState<ExerciseDetail[]>([]);

  // Step 4: Live Gym Tracker State
  // { [exerciseId]: [{ id, setNumber, weight, reps, completed, isProgressive }] }
  const [activeSets, setActiveSets] = useState<{ [exerciseId: string]: any[] }>({});
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(0);

  // Automated Rest Timer State
  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    seconds: number;
    initial: number;
  }>({
    active: false,
    seconds: 0,
    initial: 90,
  });

  // Listen to connectivity & initialize historical offline data
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingWorkouts();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    getAllSessionsOffline().then((sessions) => {
      setOfflineSessions(sessions);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Rest Timer ticking effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (restTimer.active && restTimer.seconds > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev.seconds <= 1) {
            // Vibrate device on completion
            if (typeof window !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return { ...prev, active: false, seconds: 0 };
          }
          return { ...prev, seconds: prev.seconds - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimer.active, restTimer.seconds]);

  // Scroll to top whenever step or active tab changes so header/page is never cut off
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [currentStep, activeTab]);

  // Equipment List with bespoke vector icons (zero emojis)
  const availableEquipments = [
    {
      id: "barbell",
      name: "Barbell",
      subtitle: "Tongkat & Plat Beban",
      desc: "Latihan beban kompaun untuk kekuatan maksimal dan densitas otot.",
      IconComponent: BarbellIcon,
    },
    {
      id: "dumbbell",
      name: "Dumbbell",
      subtitle: "Beban Bebas Unilateral",
      desc: "Rentang gerak lebih dalam, mengoreksi ketimpangan otot kiri-kanan.",
      IconComponent: DumbbellIcon,
    },
    {
      id: "bodyweight",
      name: "Bodyweight",
      subtitle: "Kalistenik Murni",
      desc: "Kekuatan fungsional berbasis berat tubuh tanpa alat luar.",
      IconComponent: BodyweightIcon,
    },
    {
      id: "kettlebell",
      name: "Kettlebell",
      subtitle: "Beban Besi Balistik",
      desc: "Daya ledak panggul, pembakaran lemak intensif, dan kekuatan grip.",
      IconComponent: KettlebellIcon,
    },
    {
      id: "plate",
      name: "Weight Plate",
      subtitle: "Beban Plat Bulat",
      desc: "Rotasi torsi batang tubuh, kekuatan genggaman, dan mobilitas bahu.",
      IconComponent: PlateIcon,
    },
  ];

  const toggleEquipment = (id: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((e) => e !== id) : prev) : [...prev, id]
    );
  };

  const toggleMuscle = (muscle: ExerciseAttributeValueEnum) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? (prev.length > 1 ? prev.filter((m) => m !== muscle) : prev)
        : [...prev, muscle]
    );
  };

  const selectAllMuscles = () => {
    setSelectedMuscles(MUSCLE_GROUPS.map((m) => m.enumVal));
  };

  const clearMuscles = () => {
    setSelectedMuscles([ExerciseAttributeValueEnum.CHEST]);
  };

  // Filter exercises matching selected equipment and muscles
  const filteredExercises = useMemo(() => {
    return EXERCISES_DATABASE.filter((ex) => {
      const matchesEquipment = selectedEquipments.includes(ex.equipment);
      const matchesMuscle =
        selectedMuscles.length === 0 ||
        selectedMuscles.includes(ex.primaryMuscle) ||
        ex.secondaryMuscles.some((sm) => selectedMuscles.includes(sm));
      return matchesEquipment && matchesMuscle;
    });
  }, [selectedEquipments, selectedMuscles]);

  // Keep routine list populated whenever filtering changes
  useEffect(() => {
    if (filteredExercises.length > 0) {
      setSelectedWorkoutList(filteredExercises.slice(0, 6));
    }
  }, [selectedEquipments, selectedMuscles, filteredExercises]);

  // Swap / Shuffle single exercise for one that targets the SAME primary muscle
  const handleSwapExercise = (index: number) => {
    const targetEx = selectedWorkoutList[index];
    if (!targetEx) return;

    const alternatives = EXERCISES_DATABASE.filter(
      (e) =>
        e.id !== targetEx.id &&
        e.primaryMuscle === targetEx.primaryMuscle &&
        selectedEquipments.includes(e.equipment) &&
        !selectedWorkoutList.some((sw) => sw.id === e.id)
    );

    if (alternatives.length > 0) {
      const chosen = alternatives[Math.floor(Math.random() * alternatives.length)];
      const updatedList = [...selectedWorkoutList];
      updatedList[index] = chosen;
      setSelectedWorkoutList(updatedList);

      // If active in tracker, re-initialize sets for new exercise
      if (currentStep === 4) {
        const { weight, reps, isProgressiveIncrease } = getRecommendedWeightAndReps(
          chosen.id,
          offlineSessions
        );
        setActiveSets((prev) => ({
          ...prev,
          [chosen.id]: [
            { id: 1, setNumber: 1, weight, reps, completed: false, isProgressive: isProgressiveIncrease },
            { id: 2, setNumber: 2, weight, reps, completed: false, isProgressive: false },
            { id: 3, setNumber: 3, weight, reps: Math.max(6, reps - 2), completed: false, isProgressive: false },
          ],
        }));
      }
    }
  };

  const handleDeleteExercise = (id: string) => {
    setSelectedWorkoutList((prev) => prev.filter((item) => item.id !== id));
  };

  // Start Live Gym Tracker Session with Auto Progressive Overload Pre-filling
  const startWorkoutSession = () => {
    const exercisesToTrack =
      selectedWorkoutList.length > 0 ? selectedWorkoutList : filteredExercises.slice(0, 3);
    const initialSets: { [key: string]: any[] } = {};

    exercisesToTrack.forEach((ex) => {
      const { weight, reps, isProgressiveIncrease } = getRecommendedWeightAndReps(
        ex.id,
        offlineSessions
      );
      initialSets[ex.id] = [
        { id: 1, setNumber: 1, weight, reps, completed: false, isProgressive: isProgressiveIncrease },
        { id: 2, setNumber: 2, weight, reps, completed: false, isProgressive: false },
        { id: 3, setNumber: 3, weight, reps: Math.max(6, reps - 2), completed: false, isProgressive: false },
      ];
    });

    setActiveSets(initialSets);
    setWorkoutStartTime(Date.now());
    setCurrentStep(4);
  };

  // Toggle Set Complete -> Automatically Triggers Rest Timer
  const toggleSetComplete = (exerciseId: string, setId: number) => {
    setActiveSets((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.map((s) => {
        if (s.id === setId) {
          const nextCompleted = !s.completed;
          if (nextCompleted) {
            // Trigger Automated Rest Timer
            setRestTimer({
              active: true,
              seconds: 90,
              initial: 90,
            });
          }
          return { ...s, completed: nextCompleted };
        }
        return s;
      });
      return { ...prev, [exerciseId]: updated };
    });
  };

  // Adjust Weight / Reps in Set
  const updateSetMetric = (
    exerciseId: string,
    setId: number,
    field: "weight" | "reps",
    delta: number
  ) => {
    setActiveSets((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.map((s) => {
        if (s.id === setId) {
          const nextVal = Math.max(0, Number((s[field] + delta).toFixed(1)));
          return { ...s, [field]: nextVal };
        }
        return s;
      });
      return { ...prev, [exerciseId]: updated };
    });
  };

  // End Workout Session & Generate Shareable Card (NO BROWSER ALERT)
  const finishWorkoutSession = async () => {
    const duration = Math.max(1, Math.floor((Date.now() - workoutStartTime) / 1000));
    let totalVolume = 0;
    let totalRepsCount = 0;
    const sessionExercises: any[] = [];

    selectedWorkoutList.forEach((ex) => {
      const sets = activeSets[ex.id] || [];
      const completedSets = sets.filter((s) => s.completed);
      completedSets.forEach((s) => {
        totalVolume += Number(s.weight) * Number(s.reps);
        totalRepsCount += Number(s.reps);
      });
      if (completedSets.length > 0) {
        sessionExercises.push({
          id: ex.id,
          name: ex.name,
          sets: completedSets,
        });
      }
    });

    const payload: WorkoutSessionPayload = {
      id: "session-" + Date.now(),
      title: "Sesi Latihan " + new Date().toLocaleDateString("id-ID", { weekday: "long" }),
      startedAt: workoutStartTime || Date.now() - 3600000,
      endedAt: Date.now(),
      durationSeconds: duration,
      totalVolumeKg: Math.round(totalVolume),
      totalReps: totalRepsCount,
      prsBroken: totalVolume > 5000 ? 2 : 1,
      exercises: sessionExercises,
      synced: isOnline,
    };

    // Save offline first
    await saveWorkoutSessionOffline(payload);
    const updatedHistory = await getAllSessionsOffline();
    setOfflineSessions(updatedHistory);

    // Reset scroll to top immediately so page header is fully visible
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    // Open celebratory summary modal
    setSummarySession(payload);
    setCurrentStep(1);
    setRestTimer({ active: false, seconds: 0, initial: 90 });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* 1. TOP HEADER & SPORTY BRANDING */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
            <BrandLogo className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Ayo-Olahraga
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                Pro
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Engine latihan kebugaran offline-first, biomekanika anatomi, dan progressive overload.
            </p>
          </div>
        </div>

        {/* Global Action Bar: Tools, Leaderboard, Online Status */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Connectivity Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
              isOnline
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isOnline ? "Online" : "Offline PWA"}</span>
          </div>

          {/* Leaderboard Trigger */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-gray-200 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Papan Juara</span>
          </button>

          {/* Nutrition / Tools Switcher */}
          <button
            onClick={() => setActiveTab(activeTab === "builder" ? "tools" : "builder")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              activeTab === "tools"
                ? "bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/20"
                : "bg-gray-900 hover:bg-gray-800 border-gray-800 text-gray-200"
            }`}
          >
            <Utensils className="w-4 h-4 text-orange-400" />
            <span>{activeTab === "tools" ? "Kembali Latihan" : "Alat & Nutrisi"}</span>
          </button>
        </div>
      </header>

      {/* AUTOMATED REST TIMER FLOATING BAR (Appears dynamically when active) */}
      {restTimer.active && (
        <div className="sticky top-4 z-40 w-full max-w-md mx-auto p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/90 via-gray-900/95 to-black/90 border border-orange-500/40 shadow-2xl backdrop-blur-md flex items-center justify-between animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 animate-pulse">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block leading-tight">
                Istirahat Otot (Rest Timer)
              </span>
              <span className="text-xl font-mono font-black text-white tabular-nums">
                {Math.floor(restTimer.seconds / 60)}:
                {String(restTimer.seconds % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRestTimer((p) => ({ ...p, seconds: p.seconds + 30 }))}
              className="px-2.5 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 text-xs font-mono font-bold"
            >
              +30s
            </button>
            <button
              onClick={() => setRestTimer({ active: false, seconds: 0, initial: 90 })}
              className="px-3 py-1.5 rounded-lg bg-orange-500 text-black text-xs font-bold hover:brightness-110"
            >
              Lewati
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEW: FITNESS TOOLS SECTION */}
      {activeTab === "tools" && <FitnessTools />}

      {/* MAIN VIEW: WORKOUT BUILDER & TRACKER */}
      {activeTab === "builder" && (
        <>
          {/* 2. FOUR-STEP WORKOUT PROGRESSION STEPPER */}
          <div className="flex items-start max-w-2xl mx-auto px-2 sm:px-4 py-2">
            {/* Step 1: Equipment */}
            <div
              onClick={() => setCurrentStep(1)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep > 1
                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/25"
                    : currentStep === 1
                    ? "bg-orange-500 text-black ring-4 ring-orange-500/20"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Alat</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Pilih Alat</span>
            </div>

            {/* Connecting Line 1 -> 2 */}
            <div className="flex-1 flex items-center px-1.5 sm:px-3 pt-[17px]">
              <div
                className={`w-full h-0.5 transition-colors duration-300 ${
                  currentStep > 1 ? "bg-orange-500" : "bg-gray-800"
                }`}
              />
            </div>

            {/* Step 2: Muscles */}
            <div
              onClick={() => setCurrentStep(2)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep > 2
                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/25"
                    : currentStep === 2
                    ? "bg-orange-500 text-black ring-4 ring-orange-500/20"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Otot</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Anatomi</span>
            </div>

            {/* Connecting Line 2 -> 3 */}
            <div className="flex-1 flex items-center px-1.5 sm:px-3 pt-[17px]">
              <div
                className={`w-full h-0.5 transition-colors duration-300 ${
                  currentStep > 2 ? "bg-orange-500" : "bg-gray-800"
                }`}
              />
            </div>

            {/* Step 3: Exercises */}
            <div
              onClick={() => setCurrentStep(3)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep > 3
                    ? "bg-orange-500 text-black shadow-lg shadow-orange-500/25"
                    : currentStep === 3
                    ? "bg-orange-500 text-black ring-4 ring-orange-500/20"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Gerakan</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Rutinitas</span>
            </div>

            {/* Connecting Line 3 -> 4 */}
            <div className="flex-1 flex items-center px-1.5 sm:px-3 pt-[17px]">
              <div
                className={`w-full h-0.5 transition-colors duration-300 ${
                  currentStep >= 4 ? "bg-orange-500" : "bg-gray-800"
                }`}
              />
            </div>

            {/* Step 4: Live Gym Tracker */}
            <div
              onClick={() => {
                if (selectedWorkoutList.length > 0) {
                  setCurrentStep(4);
                }
              }}
              className={`flex flex-col items-center group shrink-0 ${
                selectedWorkoutList.length > 0 ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  currentStep === 4
                    ? "bg-orange-500 text-black ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/30"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5">Tracker</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Live Sesi</span>
            </div>
          </div>

          {/* ================= STEP 1: PILIH ALAT (CUSTOM FLAT SVG ICONS) ================= */}
          {currentStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Pilih Perlengkapan Latihan
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Pilih peralatan yang tersedia untuk menyaring katalog 42 gerakan ilmiah:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {availableEquipments.map((eq) => {
                  const active = selectedEquipments.includes(eq.id);
                  const Icon = eq.IconComponent;
                  return (
                    <div
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.id)}
                      className={`relative cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                        active
                          ? "bg-[#141721] border-orange-500 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500/40"
                          : "bg-[#0c0e14] border-gray-800/80 hover:border-gray-700 hover:bg-[#10131c]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                            active
                              ? "bg-orange-500 text-black"
                              : "bg-gray-800/70 text-gray-400"
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                            active
                              ? "bg-orange-500 border-orange-400 text-black"
                              : "border-gray-700 bg-gray-900"
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-base font-black text-white">{eq.name}</h3>
                        <p className="text-[11px] font-semibold text-orange-400/90 mt-0.5">
                          {eq.subtitle}
                        </p>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{eq.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs flex items-center gap-2 hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all"
                >
                  Lanjut ke Target Otot <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ================= STEP 2: PILIH TARGET OTOT (INTERACTIVE ANATOMY) ================= */}
          {currentStep === 2 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-md mx-auto">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Pilih Kelompok Otot Sasaran
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Klik bagian tubuh pada ilustrasi anatomi interaktif untuk memfokuskan latihan:
                </p>
              </div>

              {/* Interactive 3D Anatomy Map */}
              <div className="bg-[#0c0e14] border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-xl">
                <BodyAnatomyMap
                  selectedMuscles={selectedMuscles}
                  onToggleMuscle={toggleMuscle}
                  onSelectAll={selectAllMuscles}
                  onClearMuscles={clearMuscles}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs flex items-center gap-2 hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all"
                >
                  Lihat Gerakan ({filteredExercises.length}) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ================= STEP 3: EXERCISES LIST & WORKOUT BUILDER ================= */}
          {currentStep === 3 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Susun Rutinitas Latihan ({filteredExercises.length} Pilihan Tersedia)
                  </h2>
                  <p className="text-xs text-gray-400">
                    Klik thumbnail video untuk melihat form tutorial, atau swap gerakan sejenis.
                  </p>
                </div>
                <button
                  onClick={startWorkoutSession}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs flex items-center gap-2 hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all"
                >
                  <Zap className="w-4 h-4 fill-current" /> Mulai Tracker Langsung
                </button>
              </div>

              {/* Exercise Rows */}
              <div className="space-y-3">
                {selectedWorkoutList.map((exercise, idx) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 p-3.5 bg-[#0e1017] hover:bg-[#131620] border border-gray-800/80 hover:border-orange-500/40 rounded-2xl shadow-md transition-all group"
                  >
                    <GripVertical className="w-5 h-5 text-gray-600 group-hover:text-gray-400 shrink-0 cursor-grab" />

                    {/* Thumbnail video demo */}
                    <div
                      onClick={() => setTutorialExercise(exercise)}
                      className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black border border-gray-800 cursor-pointer group/thumb"
                    >
                      <img
                        src={exercise.fullVideoImageUrl}
                        alt={exercise.name}
                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-white/80" />
                      </div>
                    </div>

                    {/* Title & Muscle Badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => setTutorialExercise(exercise)}
                          className="text-xs sm:text-sm font-bold text-white hover:text-orange-400 cursor-pointer truncate block"
                        >
                          {exercise.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
                          {exercise.primaryMuscleName.split("(")[0].trim()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span className="text-orange-400/90 font-semibold">{exercise.equipmentLabel}</span>
                        <span>•</span>
                        <span>{exercise.primaryMuscleName}</span>
                      </div>
                    </div>

                    {/* Actions: Swap Gerakan Sejenis & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSwapExercise(idx)}
                        className="p-2 rounded-xl text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20 transition-all"
                        title="Ganti dengan latihan sejenis (Same Muscle Group)"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus dari jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold"
                >
                  Kembali
                </button>
                <button
                  onClick={startWorkoutSession}
                  className="px-8 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs flex items-center gap-2 hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all"
                >
                  Mulai Latihan Sekarang <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ================= STEP 4: LIVE GYM TRACKER (COMPACT MOBILE VIEWPORT LAYOUT) ================= */}
          {currentStep === 4 && (
            <section className="space-y-5 animate-in fade-in duration-200 max-w-md mx-auto w-full">
              {/* Tracker Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Sesi Gym Aktif
                  </span>
                  <h2 className="text-lg font-black text-white">Live Gym Tracker</h2>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl"
                >
                  Atur Ulang
                </button>
              </div>

              {/* Active Exercise Cards in Centered Mobile Container */}
              <div className="space-y-4">
                {selectedWorkoutList.map((exercise, exIdx) => {
                  const sets = activeSets[exercise.id] || [];
                  const allDone = sets.length > 0 && sets.every((s) => s.completed);

                  return (
                    <div
                      key={exercise.id}
                      className="bg-[#0c0e14] border border-gray-800/90 rounded-2xl p-4 shadow-xl space-y-3"
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                            allDone
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                              : "bg-gray-800 border-gray-700 text-gray-400"
                          }`}
                        >
                          {allDone ? <Check className="w-4 h-4 stroke-[3]" /> : exIdx + 1}
                        </div>

                        <div
                          onClick={() => setTutorialExercise(exercise)}
                          className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black border border-gray-800 cursor-pointer"
                        >
                          <img
                            src={exercise.fullVideoImageUrl}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                            {exercise.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <button
                              onClick={() => setTutorialExercise(exercise)}
                              className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Video className="w-3 h-3" /> Form 3D
                            </button>
                            <span className="text-gray-600">•</span>
                            <button
                              onClick={() => handleSwapExercise(exIdx)}
                              className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
                              title="Swap gerakan ini"
                            >
                              <Shuffle className="w-3 h-3" /> Swap
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Sets - Ultra Compact Side-by-Side Table */}
                      <div className="space-y-2 pt-2 border-t border-gray-800/70">
                        {sets.map((s: any) => (
                          <div
                            key={s.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              s.completed
                                ? "bg-orange-500/5 border-orange-500/30 text-gray-300"
                                : "bg-gray-900/60 border-gray-800 text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-black text-gray-400">
                                #{s.setNumber}
                              </span>
                              {s.isProgressive && (
                                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                  +2.5kg 🔥
                                </span>
                              )}
                            </div>

                            {/* Beban (kg) Compact Stepper */}
                            <div className="flex items-center gap-1 bg-black/40 border border-gray-800 rounded-lg p-1">
                              <button
                                onClick={() => updateSetMetric(exercise.id, s.id, "weight", -2.5)}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold text-xs w-10 text-center">
                                {s.weight}
                              </span>
                              <span className="text-[10px] text-gray-500">kg</span>
                              <button
                                onClick={() => updateSetMetric(exercise.id, s.id, "weight", 2.5)}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Reps Compact Stepper */}
                            <div className="flex items-center gap-1 bg-black/40 border border-gray-800 rounded-lg p-1">
                              <button
                                onClick={() => updateSetMetric(exercise.id, s.id, "reps", -1)}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono font-bold text-xs w-8 text-center">
                                {s.reps}
                              </span>
                              <span className="text-[10px] text-gray-500">reps</span>
                              <button
                                onClick={() => updateSetMetric(exercise.id, s.id, "reps", 1)}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Checkbox Selesai Button */}
                            <button
                              onClick={() => toggleSetComplete(exercise.id, s.id)}
                              className={`p-1.5 rounded-xl border transition-all ${
                                s.completed
                                  ? "bg-orange-500 border-orange-400 text-black shadow-md shadow-orange-500/20"
                                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                              }`}
                              title={s.completed ? "Batal Selesai" : "Tandai Selesai & Mulai Rest Timer"}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Complete Workout Action Button (NO BROWSER ALERT) */}
              <div className="pt-2">
                <button
                  onClick={finishWorkoutSession}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 transition-all"
                >
                  <Trophy className="w-4 h-4 stroke-[2.5]" /> Selesaikan Sesi & Simpan
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* 4. HIGH PERFORMANCE MODALS */}
      {/* Exercise 3D Form Tutorial Modal */}
      <TutorialModal
        exercise={tutorialExercise}
        onClose={() => setTutorialExercise(null)}
      />

      {/* End-of-Workout Shareable Summary Card Modal (No Browser Alert) */}
      <WorkoutSummaryModal
        session={summarySession}
        onClose={() => {
          setSummarySession(null);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "instant" });
          }
        }}
      />

      {/* Champions Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
}
