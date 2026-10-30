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
  Lock,
  Clock,
  Trophy,
  Scale,
  Utensils,
  Flame,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Dumbbell
} from "lucide-react";
import { BodyAnatomyMap, ExerciseAttributeValueEnum, MUSCLE_GROUPS } from "@/components/BodyAnatomyMap";
import { TutorialModal } from "@/components/TutorialModal";
import { WorkoutSummaryModal } from "@/components/WorkoutSummaryModal";
import { FitnessTools } from "@/components/FitnessTools";
import { LeaderboardModal } from "@/components/LeaderboardModal";
import { ProFeatureModal } from "@/components/ProFeatureModal";
import { ChunkyStepper } from "@/components/ChunkyStepper";
import { EquipmentCard } from "@/components/EquipmentCard";
import {
  BarbellIcon,
  DumbbellIcon,
  BodyweightIcon,
  KettlebellIcon,
  PlateIcon,
  CableMachineIcon,
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);

  // Modals
  const [tutorialExercise, setTutorialExercise] = useState<ExerciseDetail | null>(null);
  const [summarySession, setSummarySession] = useState<WorkoutSessionPayload | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);

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
    {
      id: "cable_machine",
      name: "Cable & Machine",
      subtitle: "Mesin Katrol & Smith Machine",
      desc: "Isolasi hipertrofi dengan kurva resistensi stabil di seluruh rentang gerak.",
      IconComponent: CableMachineIcon,
      locked: true,
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
    setSelectedWorkoutList((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      setCurrentExerciseIndex((idx) => Math.min(idx, Math.max(0, updated.length - 1)));
      return updated;
    });
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
    setCurrentExerciseIndex(0);
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

      const allWillBeCompleted = updated.length > 0 && updated.every((s) => s.completed);
      if (allWillBeCompleted) {
        setTimeout(() => {
          setCurrentExerciseIndex((prevIdx) => {
            const currentEx = selectedWorkoutList[prevIdx];
            if (currentEx && currentEx.id === exerciseId && prevIdx < selectedWorkoutList.length - 1) {
              return prevIdx + 1;
            }
            return prevIdx;
          });
        }, 600);
      }

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

  // Direct set update from Chunky Stepper
  const setSetMetricDirect = (
    exerciseId: string,
    setId: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setActiveSets((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.map((s) => {
        if (s.id === setId) {
          return { ...s, [field]: value };
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
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div
          onClick={() => {
            setCurrentStep(1);
            setActiveTab("builder");
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="Klik untuk kembali ke halaman utama"
        >
          <div className="w-12 h-12 rounded-2xl bg-lime-400 flex items-center justify-center text-black border border-lime-300 group-hover:scale-105 transition-transform">
            <BrandLogo className="w-7 h-7 stroke-[2.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-metric text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white group-hover:text-lime-400 transition-colors">
                AYO-OLAHRAGA
              </h1>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProModalOpen(true);
                }}
                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-black font-metric flex items-center gap-1 transition-all shadow-sm"
                title="Buka Pratinjau Ayo-Olahraga Pro Suite"
              >
                <span>PRO SUITE</span>
                <Lock className="w-2.5 h-2.5 stroke-[3]" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-sans">
              Industrial gym tracker, muscle pump heatmap, dan progressive overload.
            </p>
          </div>
        </div>

        {/* Global Action Bar: Tools, Leaderboard, Online Status */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Connectivity Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              isOnline
                ? "bg-lime-400/10 border-lime-400/30 text-lime-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline font-metric font-bold uppercase">{isOnline ? "ONLINE" : "OFFLINE PWA"}</span>
          </div>

          {/* Leaderboard Trigger */}
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-xs font-metric font-bold uppercase text-gray-200 transition-colors"
          >
            <Trophy className="w-4 h-4 text-lime-400" />
            <span className="hidden sm:inline">PAPAN JUARA</span>
          </button>

          {/* Nutrition / Tools Switcher */}
          <button
            onClick={() => setActiveTab(activeTab === "builder" ? "tools" : "builder")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-metric font-bold uppercase transition-all ${
              activeTab === "tools"
                ? "bg-lime-400 text-black border-lime-400 font-bold"
                : "bg-[#141414] hover:bg-[#1E1E1E] border-[#262626] text-gray-200"
            }`}
          >
            <Utensils className="w-4 h-4 text-lime-400" />
            <span>{activeTab === "tools" ? "KEMBALI LATIHAN" : "ALAT & NUTRISI"}</span>
          </button>
        </div>
      </header>

      {/* AUTOMATED REST TIMER FLOATING BAR */}
      {restTimer.active && (
        <div className="sticky top-4 z-40 w-full max-w-md mx-auto p-3.5 rounded-2xl bg-[#0E1015]/95 border border-zinc-700 shadow-xl backdrop-blur-md flex items-center justify-between animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-black flex items-center justify-center">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-lime-400 block leading-tight font-metric">
                REST TIMER (ISTIRAHAT OTOT)
              </span>
              <span className="font-metric text-2xl font-black text-white tabular-nums tracking-tight">
                {Math.floor(restTimer.seconds / 60)}:
                {String(restTimer.seconds % 60).padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRestTimer((p) => ({ ...p, seconds: p.seconds + 30 }))}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-metric font-bold border border-zinc-700"
            >
              +30S
            </button>
            <button
              onClick={() => setRestTimer({ active: false, seconds: 0, initial: 90 })}
              className="px-3.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-black text-xs font-metric font-extrabold uppercase transition-colors"
            >
              LEWATI
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
                className={`w-9 h-9 rounded-full flex items-center justify-center font-metric font-bold text-xs transition-all ${
                  currentStep > 1
                    ? "bg-[#DFFF00] text-black shadow-md shadow-[#DFFF00]/30"
                    : currentStep === 1
                    ? "bg-[#DFFF00] text-black ring-4 ring-[#DFFF00]/20 shadow-lg shadow-[#DFFF00]/40"
                    : "bg-[#181818] text-gray-400 border border-[#2A2A2A]"
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3.5]" /> : "1"}
              </div>
              <span className="text-xs font-bold text-white mt-1.5 font-metric tracking-wide">ALAT</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Pilih Alat</span>
            </div>

            {/* Connecting Line 1 -> 2 */}
            <div className="flex-1 flex items-center px-1.5 sm:px-3 pt-[17px]">
              <div
                className={`w-full h-0.5 transition-colors duration-300 ${
                  currentStep > 1 ? "bg-[#DFFF00]" : "bg-[#242424]"
                }`}
              />
            </div>

            {/* Step 2: Muscles */}
            <div
              onClick={() => setCurrentStep(2)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-metric font-bold text-xs transition-all ${
                  currentStep > 2
                    ? "bg-[#DFFF00] text-black shadow-md shadow-[#DFFF00]/30"
                    : currentStep === 2
                    ? "bg-[#DFFF00] text-black ring-4 ring-[#DFFF00]/20 shadow-lg shadow-[#DFFF00]/40"
                    : "bg-[#181818] text-gray-400 border border-[#2A2A2A]"
                }`}
              >
                {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3.5]" /> : "2"}
              </div>
              <span className="text-xs font-bold text-white mt-1.5 font-metric tracking-wide">OTOT</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Heatmap</span>
            </div>

            {/* Connecting Line 2 -> 3 */}
            <div className="flex-1 flex items-center px-1.5 sm:px-3 pt-[17px]">
              <div
                className={`w-full h-0.5 transition-colors duration-300 ${
                  currentStep > 2 ? "bg-[#DFFF00]" : "bg-[#242424]"
                }`}
              />
            </div>

            {/* Step 3: Exercises */}
            <div
              onClick={() => setCurrentStep(3)}
              className="flex flex-col items-center cursor-pointer group shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-metric font-bold text-xs transition-all ${
                  currentStep > 3
                    ? "bg-[#DFFF00] text-black shadow-md shadow-[#DFFF00]/30"
                    : currentStep === 3
                    ? "bg-[#DFFF00] text-black ring-4 ring-[#DFFF00]/20 shadow-lg shadow-[#DFFF00]/40"
                    : "bg-[#181818] text-gray-400 border border-[#2A2A2A]"
                }`}
              >
                {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3.5]" /> : "3"}
              </div>
              <span className="text-xs font-bold text-white mt-1.5 font-metric tracking-wide">GERAKAN</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Rutinitas</span>
            </div>

            {/* Connecting Line 3 -> 4 */}
            <div className="flex-1 flex items-center px-1.5 sm:px-3 pt-[17px]">
              <div
                className={`w-full h-0.5 transition-colors duration-300 ${
                  currentStep >= 4 ? "bg-[#DFFF00]" : "bg-[#242424]"
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
                className={`w-9 h-9 rounded-full flex items-center justify-center font-metric font-bold text-xs transition-all ${
                  currentStep === 4
                    ? "bg-[#DFFF00] text-black ring-4 ring-[#DFFF00]/20 shadow-lg shadow-[#DFFF00]/40 animate-volt-pulse"
                    : "bg-[#181818] text-gray-400 border border-[#2A2A2A]"
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-xs font-bold text-white mt-1.5 font-metric tracking-wide">TRACKER</span>
              <span className="text-[10px] text-gray-400 hidden xs:inline">Live Sesi</span>
            </div>
          </div>

          {/* ================= STEP 1: PILIH ALAT (CUSTOM FLAT SVG ICONS) ================= */}
          {currentStep === 1 && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center max-w-md mx-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#DFFF00] font-metric block mb-1">
                  LANGKAH 01 / PERLENGKAPAN GYM
                </span>
                <h2 className="font-metric text-2xl sm:text-3xl font-extrabold uppercase text-white tracking-tight">
                  PILIH PERALATAN LATIHAN
                </h2>
                <p className="text-xs text-gray-400 mt-1 font-sans">
                  Saring katalog 42 gerakan ilmiah berdasarkan ketersediaan alat di gym atau rumah Anda:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {availableEquipments.map((eq) => (
                  <EquipmentCard
                    key={eq.id}
                    id={eq.id}
                    name={eq.name}
                    subtitle={eq.subtitle}
                    desc={eq.desc}
                    IconComponent={eq.IconComponent}
                    selected={selectedEquipments.includes(eq.id)}
                    onToggle={() => toggleEquipment(eq.id)}
                    locked={eq.locked}
                    onLockedClick={() => setIsProModalOpen(true)}
                  />
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all active:scale-98"
                >
                  LANJUT KE TARGET OTOT <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
                  className="px-6 py-3 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#282828] text-gray-300 font-metric font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  KEMBALI
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all active:scale-98"
                >
                  LIHAT GERAKAN ({filteredExercises.length}) <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
                  className="px-6 py-2.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-98"
                >
                  <Zap className="w-4 h-4 fill-current" /> MULAI TRACKER LANGSUNG
                </button>
              </div>

              {/* Exercise Rows */}
              <div className="space-y-3">
                {selectedWorkoutList.map((exercise, idx) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-3 p-3.5 bg-[#0E0E0E] hover:bg-[#141414] border border-[#222222] hover:border-[#DFFF00]/50 rounded-2xl shadow-lg transition-all group"
                  >
                    <GripVertical className="w-5 h-5 text-gray-600 group-hover:text-gray-400 shrink-0 cursor-grab" />

                    {/* Thumbnail video demo */}
                    <div
                      onClick={() => setTutorialExercise(exercise)}
                      className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black border border-[#262626] cursor-pointer group/thumb"
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
                          className="text-xs sm:text-sm font-bold text-white hover:text-[#DFFF00] cursor-pointer truncate block"
                        >
                          {exercise.name}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DFFF00]/15 text-[#DFFF00] border border-[#DFFF00]/30 shrink-0 font-metric tracking-wider">
                          {exercise.primaryMuscleName.split("(")[0].trim()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 font-sans">
                        <span className="text-[#DFFF00] font-bold font-metric tracking-wide">{exercise.equipmentLabel}</span>
                        <span>•</span>
                        <span>{exercise.primaryMuscleName}</span>
                      </div>
                    </div>

                    {/* Actions: Swap Gerakan Sejenis & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleSwapExercise(idx)}
                        className="p-2 rounded-xl text-gray-400 hover:text-[#DFFF00] hover:bg-[#DFFF00]/10 border border-transparent hover:border-[#DFFF00]/20 transition-all"
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

              <div className="flex items-center justify-between pt-4 border-t border-[#222222]">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#282828] text-gray-300 font-metric font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  KEMBALI
                </button>
                <button
                  onClick={startWorkoutSession}
                  className="px-8 py-3.5 rounded-full bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all active:scale-98"
                >
                  MULAI LATIHAN SEKARANG <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </section>
          )}

          {/* ================= STEP 4: LIVE GYM TRACKER (3D COVER FLOW & PEAKING CARD CAROUSEL) ================= */}
          {currentStep === 4 && (
            <section className="space-y-4 animate-in fade-in duration-200 max-w-xl sm:max-w-2xl mx-auto w-full">
              {/* Tracker Top Bar: Exit button & Exercise counter */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 px-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-3.5 py-1.5 bg-[#141414] hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-metric font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
                  title="Keluar dari sesi gym"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>KELUAR SESI</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime-400 flex items-center justify-end gap-1.5 font-metric">
                    <span className="w-2 h-2 rounded-full bg-lime-400" /> SESI AKTIF
                  </span>
                  <span className="font-metric text-xs font-bold text-zinc-400">
                    Latihan {currentExerciseIndex + 1} dari {selectedWorkoutList.length}
                  </span>
                </div>
              </div>

              {/* Exercise Indicators (Pills / Dots) for Quick Direct Jump */}
              <div className="flex items-center justify-center gap-1.5 py-1">
                {selectedWorkoutList.map((ex, idx) => {
                  const exSets = activeSets[ex.id] || [];
                  const isDone = exSets.length > 0 && exSets.every((s: any) => s.completed);
                  const isCurrent = idx === currentExerciseIndex;

                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setCurrentExerciseIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? "w-8 bg-lime-400"
                          : isDone
                          ? "w-3 bg-zinc-500"
                          : "w-2 bg-zinc-800 hover:bg-zinc-700"
                      }`}
                      title={`${idx + 1}. ${ex.name}`}
                    />
                  );
                })}
              </div>

              {/* 3D COVER FLOW / PEEKING CARDS CAROUSEL CONTAINER */}
              <div className="relative overflow-hidden w-full py-2">
                {/* Floating Chevron Navigation Buttons (Nike Airmax Style) */}
                {currentExerciseIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentExerciseIndex((prev) => Math.max(0, prev - 1))}
                    aria-label="Latihan Sebelumnya"
                    className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-white border border-zinc-700 shadow-2xl flex items-center justify-center transition-all backdrop-blur-md"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}

                {currentExerciseIndex < selectedWorkoutList.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentExerciseIndex((prev) => Math.min(selectedWorkoutList.length - 1, prev + 1))}
                    aria-label="Latihan Berikutnya"
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-white border border-zinc-700 shadow-2xl flex items-center justify-center transition-all backdrop-blur-md"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}

                {/* Sliding Cards Track with Math-Exact Symmetric Peeking */}
                <div
                  className="flex transition-transform duration-500 ease-out will-change-transform items-start"
                  style={{
                    transform: `translateX(calc(11% - ${currentExerciseIndex} * (78% + 14px)))`,
                  }}
                >
                  {selectedWorkoutList.map((exercise, exIdx) => {
                    const sets = activeSets[exercise.id] || [];
                    const allDone = sets.length > 0 && sets.every((s) => s.completed);
                    const isLastExercise = exIdx === selectedWorkoutList.length - 1;
                    const isActive = exIdx === currentExerciseIndex;

                    return (
                      <div
                        key={exercise.id}
                        onClick={() => {
                          if (!isActive) setCurrentExerciseIndex(exIdx);
                        }}
                        style={{ width: "78%", marginRight: "14px" }}
                        className={`shrink-0 transition-all duration-500 ease-out rounded-3xl select-none ${
                          isActive
                            ? "scale-100 opacity-100 z-20 pointer-events-auto"
                            : "scale-[0.90] opacity-35 hover:opacity-60 z-10 cursor-pointer pointer-events-auto"
                        }`}
                      >
                        <div
                          className={`rounded-3xl p-4 sm:p-5 space-y-4 transition-all duration-500 ${
                            isActive
                              ? "bg-[#0E1015] border-2 border-lime-400/40 shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
                              : "bg-[#0A0B0E] border border-zinc-800 shadow-lg"
                          }`}
                        >
                          {/* Exercise Header */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl font-metric font-extrabold text-sm flex items-center justify-center shrink-0 border transition-all ${
                                allDone
                                  ? "bg-lime-400 border-lime-400 text-black font-bold"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-200"
                              }`}
                            >
                              {allDone ? <Check className="w-4 h-4 stroke-[3.5]" /> : exIdx + 1}
                            </div>

                            <div
                              onClick={(e) => {
                                if (isActive) {
                                  e.stopPropagation();
                                  setTutorialExercise(exercise);
                                }
                              }}
                              className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black border border-zinc-800 cursor-pointer group/thumb"
                            >
                              <img
                                src={exercise.fullVideoImageUrl}
                                alt={exercise.name}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Play className="w-3.5 h-3.5 text-white fill-white" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-black text-white truncate font-sans">
                                {exercise.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    if (isActive) {
                                      e.stopPropagation();
                                      setTutorialExercise(exercise);
                                    }
                                  }}
                                  className="text-[11px] text-lime-400 hover:underline flex items-center gap-1 font-bold font-metric tracking-wide"
                                >
                                  <Video className="w-3 h-3" /> FORM 3D
                                </button>
                                <span className="text-zinc-600">•</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    if (isActive) {
                                      e.stopPropagation();
                                      handleSwapExercise(exIdx);
                                    }
                                  }}
                                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-sans"
                                  title="Ganti dengan latihan sejenis"
                                >
                                  <Shuffle className="w-3 h-3" /> Swap
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Sets - Fat-Finger Chunky Steppers */}
                          <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                            {sets.map((s) => (
                              <div
                                key={s.id}
                                className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                                  s.completed
                                    ? "bg-[#12141A] border-zinc-800"
                                    : "bg-[#0F1015] border-zinc-800/60"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-metric text-base font-black tracking-wide text-white">
                                      SET #{s.setNumber}
                                    </span>
                                    {s.isProgressive && (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-lime-400/15 text-lime-400 border border-lime-400/30 font-metric tracking-wider">
                                        +2.5KG PROGRESSION 🔥
                                      </span>
                                    )}
                                  </div>
                                  {s.completed && (
                                    <span className="text-[10px] font-black uppercase text-lime-400 font-metric flex items-center gap-1 font-bold">
                                      <Check className="w-3.5 h-3.5 stroke-[3.5]" /> SELESAI
                                    </span>
                                  )}
                                </div>

                                {/* 2 Chunky Steppers: BEBAN (KG) & REPS */}
                                <div className="grid grid-cols-2 gap-2.5">
                                  <ChunkyStepper
                                    label="Beban"
                                    unit="KG"
                                    value={s.weight}
                                    step={2.5}
                                    min={0}
                                    quickAddOptions={[2.5, 5]}
                                    onChange={(val) => setSetMetricDirect(exercise.id, s.id, "weight", val)}
                                    disabled={s.completed || !isActive}
                                  />
                                  <ChunkyStepper
                                    label="Reps"
                                    unit="REPS"
                                    value={s.reps}
                                    step={1}
                                    min={1}
                                    quickAddOptions={[1, 2]}
                                    onChange={(val) => setSetMetricDirect(exercise.id, s.id, "reps", val)}
                                    disabled={s.completed || !isActive}
                                  />
                                </div>

                                {/* Full-Width Block Selesai Button */}
                                <button
                                  type="button"
                                  disabled={!isActive}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSetComplete(exercise.id, s.id);
                                  }}
                                  className={`w-full py-3.5 px-4 rounded-xl font-metric font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 ${
                                    s.completed
                                      ? "bg-lime-400 hover:bg-lime-300 text-black border border-lime-500 font-bold"
                                      : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 hover:border-lime-400/50"
                                  }`}
                                >
                                  <Check className={`w-4 h-4 stroke-[3.5] ${s.completed ? "text-black" : "text-zinc-400"}`} />
                                  <span>{s.completed ? "SET SELESAI (REST TIMER AKTIF)" : "TANDAI SELESAI SET"}</span>
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Action inside card */}
                          <div className="pt-2">
                            {!isLastExercise ? (
                              <button
                                type="button"
                                disabled={!isActive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentExerciseIndex(exIdx + 1);
                                }}
                                className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-metric font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
                              >
                                <span>LANJUT KE GERAKAN BERIKUTNYA</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={!isActive}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  finishWorkoutSession();
                                }}
                                className="w-full py-4 rounded-2xl bg-lime-400 hover:bg-lime-300 text-black font-metric font-extrabold text-base uppercase tracking-wider flex items-center justify-center gap-2 border border-lime-500 shadow-xl transition-all active:scale-98"
                              >
                                <Trophy className="w-5 h-5 stroke-[2.5]" /> SELESAIKAN SESI & SIMPAN
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Navigation & Skip Without Tracking Link */}
              <div className="flex items-center justify-between pt-1 px-1">
                {currentExerciseIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentExerciseIndex((prev) => Math.max(0, prev - 1))}
                    className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 py-1.5 transition-colors"
                  >
                    <span>← Gerakan Sebelumnya</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (currentExerciseIndex < selectedWorkoutList.length - 1) {
                      setCurrentExerciseIndex((prev) => prev + 1);
                    } else {
                      finishWorkoutSession();
                    }
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-lime-400 flex items-center gap-1.5 ml-auto py-1.5 transition-colors group"
                >
                  <span className="underline-offset-4 group-hover:underline">
                    {currentExerciseIndex < selectedWorkoutList.length - 1
                      ? "Lanjut tanpa mengisi tracking"
                      : "Selesaikan sesi tanpa mengisi tracking"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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

      {/* Pro Tier Feature Modal */}
      <ProFeatureModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </div>
  );
}
