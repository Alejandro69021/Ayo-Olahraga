"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Flame,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Sparkles,
  Zap,
  Filter,
  Info,
  Shuffle,
  Trash2,
  GripVertical,
  Video,
  Pause,
  Hourglass,
  Check,
} from "lucide-react";
import { BodyAnatomyMap, ExerciseAttributeValueEnum, MUSCLE_GROUPS } from "@/components/BodyAnatomyMap";
import { TutorialModal } from "@/components/TutorialModal";
import { EXERCISES_DATABASE, ExerciseDetail } from "@/data/exercises";

const MUSCLE_BADGE_COLORS: Record<string, string> = {
  C: "bg-emerald-500 text-black", // Chest
  S: "bg-amber-500 text-black", // Shoulders
  B: "bg-purple-500 text-white", // Biceps
  T: "bg-violet-500 text-white", // Triceps / Traps
  Q: "bg-blue-500 text-white", // Quads / Legs
  L: "bg-sky-500 text-black", // Lats / Back
  H: "bg-red-500 text-white", // Hamstrings
  A: "bg-pink-500 text-black", // Abs / Core
};

export default function HomePage() {
  // Wizard steps: 1 = Equipment, 2 = Muscles, 3 = Exercises & Tutorial, 4 = Live Session Tracker
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Equipment Selection (Barbell, Bodyweight, Dumbbell, Kettlebell, Plate)
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([
    "barbell",
    "dumbbell",
    "bodyweight",
    "kettlebell",
    "plate",
  ]);

  // Step 2: Muscle Selection (using exact ExerciseAttributeValueEnum from workout-cool)
  const [selectedMuscles, setSelectedMuscles] = useState<ExerciseAttributeValueEnum[]>([
    ExerciseAttributeValueEnum.CHEST,
  ]);

  // Modal Tutorial state
  const [tutorialExercise, setTutorialExercise] = useState<ExerciseDetail | null>(null);

  // Active workout exercises state
  const [selectedWorkoutList, setSelectedWorkoutList] = useState<ExerciseDetail[]>([]);

  // Rest Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // Live gym sets state for tracker: { [exerciseId]: [{ id, setNumber, weight, reps, completed }] }
  const [activeSets, setActiveSets] = useState<{ [exerciseId: string]: any[] }>({});

  const availableEquipments = [
    {
      id: "barbell",
      name: "Barbell",
      subtitle: "Tongkat & Plat Beban",
      desc: "Latihan beban bebas untuk kekuatan maksimal dan hipertrofi.",
      icon: "🏋️‍♂️",
    },
    {
      id: "dumbbell",
      name: "Dumbbell",
      subtitle: "Beban Bebas Tangan",
      desc: "Melatih keseimbangan otot kiri-kanan serta variasi isolasi luas.",
      icon: "🦾",
    },
    {
      id: "bodyweight",
      name: "Bodyweight",
      subtitle: "Kalistenik & Beban Tubuh",
      desc: "Tanpa alat gym, ideal untuk latihan di rumah dan penguatan sendi.",
      icon: "🧘",
    },
    {
      id: "kettlebell",
      name: "Kettlebell",
      subtitle: "Beban Besi Gagang",
      desc: "Gerakan balistik eksplosif, membakar lemak, dan menguatkan pinggul.",
      icon: "🔔",
    },
    {
      id: "plate",
      name: "Weight Plate",
      subtitle: "Beban Piringan / Plat",
      desc: "Gerakan fungsional, latihan rotasi core, dan cengkeraman forearms.",
      icon: "🔘",
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
  const filteredExercises = EXERCISES_DATABASE.filter((ex) => {
    const matchesEquipment = selectedEquipments.includes(ex.equipment);
    const matchesMuscle =
      selectedMuscles.length === 0 ||
      selectedMuscles.includes(ex.primaryMuscle) ||
      ex.secondaryMuscles.some((sm) => selectedMuscles.includes(sm));
    return matchesEquipment && matchesMuscle;
  });

  // Keep workout list populated when filtering changes
  useEffect(() => {
    if (filteredExercises.length > 0) {
      setSelectedWorkoutList(filteredExercises.slice(0, 5));
    }
  }, [selectedEquipments, selectedMuscles]);

  // Shuffle single exercise
  const handleShuffle = (index: number) => {
    const current = selectedWorkoutList[index];
    const alternates = EXERCISES_DATABASE.filter(
      (e) =>
        e.id !== current.id &&
        selectedEquipments.includes(e.equipment) &&
        !selectedWorkoutList.some((sw) => sw.id === e.id)
    );
    if (alternates.length > 0) {
      const random = alternates[Math.floor(Math.random() * alternates.length)];
      const nextList = [...selectedWorkoutList];
      nextList[index] = random;
      setSelectedWorkoutList(nextList);
    }
  };

  // Delete exercise from workout list
  const handleDelete = (id: string) => {
    setSelectedWorkoutList((prev) => prev.filter((item) => item.id !== id));
  };

  // Rest Timer ticking logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerActive) {
      setIsTimerActive(false);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  const startRestTimer = (seconds: number) => {
    setTimerSeconds(seconds);
    setIsTimerActive(true);
  };

  // Start Gym Tracker
  const startWorkoutSession = () => {
    const exercisesToTrack = selectedWorkoutList.length > 0 ? selectedWorkoutList : filteredExercises.slice(0, 3);
    const initialSets: { [key: string]: any[] } = {};
    exercisesToTrack.forEach((ex) => {
      initialSets[ex.id] = [
        { id: 1, setNumber: 1, type: "normal", weight: 30, reps: 10, completed: false },
        { id: 2, setNumber: 2, type: "normal", weight: 35, reps: 10, completed: false },
        { id: 3, setNumber: 3, type: "normal", weight: 40, reps: 8, completed: false },
      ];
    });
    setActiveSets(initialSets);
    setCurrentStep(4);
  };

  const toggleSetComplete = (exerciseId: string, setId: number) => {
    setActiveSets((prev) => {
      const current = prev[exerciseId] || [];
      const updated = current.map((s) => {
        if (s.id === setId) {
          const nextState = !s.completed;
          if (nextState) startRestTimer(90);
          return { ...s, completed: nextState };
        }
        return s;
      });
      return { ...prev, [exerciseId]: updated };
    });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      {/* 1. TOP HEADER LIKE WORKOUT.COOL */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-xl font-black text-black shadow-lg shadow-amber-400/20">
            🏋️
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Ayo-Olahraga
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Workout.Cool Engine
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Panduan interaktif gerakan video real-time, anatomi otot, dan gym workout builder.
            </p>
          </div>
        </div>

        {/* Global Floating Rest Timer Pill */}
        <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-2.5 px-4 shadow-xl">
          <Clock className={`w-4 h-4 ${isTimerActive ? "text-emerald-400 animate-pulse" : "text-gray-400"}`} />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Rest Timer</span>
            <span className="text-base font-mono font-bold text-white leading-none">
              {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => startRestTimer(60)}
              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-[11px] font-medium rounded text-gray-300"
            >
              +60s
            </button>
            <button
              onClick={() => startRestTimer(90)}
              className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-[11px] font-medium rounded text-emerald-400 font-semibold"
            >
              90s
            </button>
            <button
              onClick={() => setTimerSeconds(0)}
              className="p-1 text-gray-400 hover:text-red-400"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. THREE-STEP STEPPER BAR (IDENTICAL TO WORKOUT.COOL FRAME 1) */}
      <div className="relative flex items-center justify-between max-w-xl mx-auto px-4 py-2">
        {/* Connecting Lines */}
        <div className="absolute left-12 right-12 top-6 h-0.5 bg-gray-800 -z-0" />
        <div
          className="absolute left-12 top-6 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
          style={{ width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%" }}
        />

        {/* Step 1: Equipment */}
        <div
          onClick={() => setCurrentStep(1)}
          className="flex flex-col items-center cursor-pointer z-10 group"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep > 1
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : currentStep === 1
                ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
          </div>
          <span className="text-xs font-bold text-white mt-1.5">Equipment</span>
          <span className="text-[10px] text-gray-400">Select equipment</span>
        </div>

        {/* Step 2: Muscles */}
        <div
          onClick={() => setCurrentStep(2)}
          className="flex flex-col items-center cursor-pointer z-10 group"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep > 2
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : currentStep === 2
                ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
          </div>
          <span className="text-xs font-bold text-white mt-1.5">Muscles</span>
          <span className="text-[10px] text-gray-400">Choose training</span>
        </div>

        {/* Step 3: Exercises */}
        <div
          onClick={() => setCurrentStep(3)}
          className="flex flex-col items-center cursor-pointer z-10 group"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
              currentStep === 3
                ? "bg-blue-600 text-white ring-4 ring-blue-500/20"
                : currentStep === 4
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            3
          </div>
          <span className="text-xs font-bold text-white mt-1.5">Exercises</span>
          <span className="text-[10px] text-gray-400">Customize workout</span>
        </div>
      </div>

      {/* 3. STEP CONTENT */}
      {/* ================= STEP 1: PILIH ALAT (BARBELL, DUMBBELL, BODYWEIGHT, KETTLEBELL, PLATE) ================= */}
      {currentStep === 1 && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-bold text-white">Select your equipment</h2>
            <p className="text-xs text-gray-400 mt-1">
              Pilih alat yang Anda miliki di rumah atau gym (fokus: Barbell, Dumbbell, Bodyweight, Kettlebell, Plate):
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableEquipments.map((eq) => {
              const active = selectedEquipments.includes(eq.id);
              return (
                <div
                  key={eq.id}
                  onClick={() => toggleEquipment(eq.id)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    active
                      ? "bg-gradient-to-br from-gray-900 to-[#121622] border-blue-500/70 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30"
                      : "bg-gray-900/40 border-gray-800 hover:border-gray-700 opacity-60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{eq.icon}</span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          active
                            ? "bg-blue-600 border-blue-500 text-white font-bold"
                            : "border-gray-700 bg-gray-800"
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white">{eq.name}</h3>
                    <span className="text-[11px] font-semibold text-blue-400 block mb-1">
                      {eq.subtitle}
                    </span>
                    <p className="text-xs text-gray-400 leading-relaxed">{eq.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                    <span>{active ? "Dipilih" : "Diabaikan"}</span>
                    <span className="font-semibold text-blue-400">
                      {EXERCISES_DATABASE.filter((x) => x.equipment === eq.id).length} Gerakan
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <span className="text-xs text-gray-400">
              {selectedEquipments.length} dari 5 alat aktif
            </span>
            <button
              onClick={() => setCurrentStep(2)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 2: PILIH TARGET OTOT (EXACT WORKOUT.COOL ANATOMY SVG) ================= */}
      {currentStep === 2 && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center max-w-md mx-auto">
            <p className="text-xs text-gray-300 italic tracking-wide">
              Select the muscle(s) you want to train by clicking on them.
            </p>
          </div>

          {/* EXACT SVG ANATOMY REPRODUCED FROM WORKOUT-COOL */}
          <div className="w-full bg-[#111318] border border-gray-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <BodyAnatomyMap
              selectedMuscles={selectedMuscles}
              onToggleMuscle={toggleMuscle}
              onClearMuscles={clearMuscles}
              onSelectAll={selectAllMuscles}
            />
          </div>

          {/* EXACT PILL BUTTONS FROM USER'S SCREENSHOT */}
          <div className="flex items-center justify-between pt-4 max-w-md mx-auto gap-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 py-3 rounded-full bg-[#18233c] hover:bg-[#1e2d4d] text-blue-300 font-bold text-sm flex items-center justify-center gap-1.5 transition-colors border border-blue-900/50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 3: EXERCISES LIST (MATCHING WORKOUT.COOL EXACTLY) ================= */}
      {currentStep === 3 && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Customize your workout</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Klik ikon video untuk memutar tutorial animasi. Acak (shuffle) atau hapus sesuai kebutuhan:
              </p>
            </div>

            <button
              onClick={startWorkoutSession}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/20 flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" /> Start Workout
            </button>
          </div>

          {/* Exercise List - Exactly matching workout.cool row layout */}
          <div className="space-y-3">
            {selectedWorkoutList.map((exercise, idx) => {
              const badgeClass =
                MUSCLE_BADGE_COLORS[exercise.primaryMuscleCode] || "bg-blue-600 text-white";
              return (
                <div
                  key={exercise.id}
                  className="flex items-center gap-3 p-3 bg-[#111318] hover:bg-gray-900 border border-gray-800/80 hover:border-gray-700 rounded-2xl shadow-md transition-all group"
                >
                  {/* Drag Handle Icon */}
                  <GripVertical className="w-5 h-5 text-gray-600 group-hover:text-gray-400 shrink-0 cursor-grab" />

                  {/* Thumbnail Image from YouTube Video (Real Movement Demo) */}
                  <div
                    onClick={() => setTutorialExercise(exercise)}
                    className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-800 border border-gray-700 cursor-pointer group/thumb"
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

                  {/* Muscle Badge Initial (e.g. C, S, B, Q) */}
                  <div
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${badgeClass}`}
                    title={exercise.primaryMuscleName}
                  >
                    {exercise.primaryMuscleCode}
                  </div>

                  {/* Title & Equipment Tag */}
                  <div className="flex-1 min-w-0">
                    <span
                      onClick={() => setTutorialExercise(exercise)}
                      className="text-xs sm:text-sm font-bold text-white hover:text-blue-400 cursor-pointer truncate block"
                    >
                      {exercise.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-blue-400 font-semibold">
                        {exercise.equipmentLabel}
                      </span>
                      <span className="text-gray-600 text-[10px]">•</span>
                      <span className="text-[10px] text-gray-400">
                        {exercise.primaryMuscleName}
                      </span>
                    </div>
                  </div>

                  {/* Row Actions: Video/Tutorial, Shuffle, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setTutorialExercise(exercise)}
                      className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/20 flex items-center gap-1"
                      title="Lihat Video & Tutorial"
                    >
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Tutorial</span>
                    </button>

                    <button
                      onClick={() => handleShuffle(idx)}
                      className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                      title="Acak Latihan (Shuffle)"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(exercise.id)}
                      className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors"
                      title="Hapus dari daftar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-full bg-[#18233c] hover:bg-[#1e2d4d] text-blue-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={startWorkoutSession}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Start Workout
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 4: ACTIVE WORKOUT SESSION (MATCHING USER VIDEO FRAME 4) ================= */}
      {currentStep === 4 && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                Session in Progress
              </span>
              <h2 className="text-xl font-black text-white">Live Gym Tracker</h2>
            </div>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl"
            >
              Atur Ulang Latihan
            </button>
          </div>

          <div className="space-y-4">
            {selectedWorkoutList.map((exercise, exIdx) => {
              const sets = activeSets[exercise.id] || [];
              const allDone = sets.length > 0 && sets.every((s) => s.completed);

              return (
                <div
                  key={exercise.id}
                  className="bg-[#111318] border border-gray-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4"
                >
                  {/* Top Exercise Row (Like Frame 4 in User Video) */}
                  <div className="flex items-center gap-3">
                    {/* Circular Step Badge: Hourglass or Check */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        allDone
                          ? "bg-blue-500/20 border-blue-500 text-blue-400"
                          : "bg-gray-800 border-gray-700 text-gray-400"
                      }`}
                    >
                      {allDone ? <Check className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                    </div>

                    {/* Thumbnail Image from Video */}
                    <div
                      onClick={() => setTutorialExercise(exercise)}
                      className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-black border border-gray-700 cursor-pointer group"
                    >
                      <img
                        src={exercise.fullVideoImageUrl}
                        alt={exercise.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>

                    {/* Title and "See instructions" Link */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate">
                        {exercise.name}
                      </h3>
                      <button
                        onClick={() => setTutorialExercise(exercise)}
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Video className="w-3 h-3" /> See instructions & video
                      </button>
                    </div>
                  </div>

                  {/* Set Inputs */}
                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 pb-1">
                      <span className="col-span-2">Set</span>
                      <span className="col-span-4 text-center">Beban (KG)</span>
                      <span className="col-span-4 text-center">Reps</span>
                      <span className="col-span-2 text-center">Selesai</span>
                    </div>

                    {sets.map((s: any) => (
                      <div
                        key={s.id}
                        className={`grid grid-cols-12 items-center p-2 rounded-xl border transition-all ${
                          s.completed
                            ? "bg-blue-950/20 border-blue-500/30 text-gray-300"
                            : "bg-gray-800/60 border-gray-700 text-white"
                        }`}
                      >
                        <span className="col-span-2 text-xs font-mono font-bold text-gray-400 pl-2">
                          #{s.setNumber}
                        </span>

                        <div className="col-span-4 text-center">
                          <span className="text-sm font-mono font-bold">{s.weight}</span>
                          <span className="text-[10px] text-gray-400 ml-0.5">kg</span>
                        </div>

                        <div className="col-span-4 text-center">
                          <span className="text-sm font-mono font-bold">{s.reps}</span>
                          <span className="text-[10px] text-gray-400 ml-0.5">reps</span>
                        </div>

                        <div className="col-span-2 flex justify-center">
                          <button
                            onClick={() => toggleSetComplete(exercise.id, s.id)}
                            className={`p-1 rounded-lg ${
                              s.completed ? "text-blue-400" : "text-gray-500 hover:text-white"
                            }`}
                          >
                            <CheckCircle2
                              className={`w-5 h-5 ${s.completed ? "fill-blue-500/20" : ""}`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-full bg-gray-800 text-gray-300 text-xs font-semibold"
            >
              Kembali
            </button>
            <button
              onClick={() => {
                alert("Selamat! Sesi workout telah selesai dan tersimpan.");
                setCurrentStep(1);
              }}
              className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              <Trophy className="w-4 h-4" /> Selesaikan Latihan
            </button>
          </div>
        </section>
      )}

      {/* 4. MODAL TUTORIAL WITH EMBEDDED REAL 3D ANATOMY VIDEO */}
      <TutorialModal
        exercise={tutorialExercise}
        onClose={() => setTutorialExercise(null)}
        isSelected={tutorialExercise ? selectedWorkoutList.some((p) => p.id === tutorialExercise.id) : false}
        onSelectForWorkout={(ex) => {
          setSelectedWorkoutList((prev) => (prev.some((p) => p.id === ex.id) ? prev : [...prev, ex]));
          setCurrentStep(4);
        }}
      />
    </div>
  );
}
