"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { ExerciseDetail } from "@/data/exercises";
import { FormCoachSummary } from "./ResultSummary";

// Muat CameraStage via next/dynamic dengan { ssr: false } karena butuh browser API
const CameraStage = dynamic(
  () => import("./CameraStage").then((mod) => mod.CameraStage),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] bg-[#080808] rounded-none sm:rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6 border border-zinc-800">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="font-metric text-xs font-bold uppercase text-zinc-300 tracking-wider">
          Menyiapkan Panggung AI Form Coach...
        </span>
      </div>
    ),
  }
);

interface FormCoachModalProps {
  exercise: ExerciseDetail | null;
  onClose: () => void;
  onComplete?: (summary: FormCoachSummary) => void;
}

export const FormCoachModal: React.FC<FormCoachModalProps> = ({
  exercise,
  onClose,
  onComplete,
}) => {
  // Cegah scroll latar belakang & tutup via tombol Escape
  useEffect(() => {
    if (exercise) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exercise, onClose]);

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 motion-reduce:animate-none">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-h-[850px] max-w-3xl bg-[#090A0F] border-0 sm:border border-zinc-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <CameraStage
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          view={exercise.formCoach?.view}
          cameraTip={exercise.formCoach?.cameraTip}
          equipmentLabel={exercise.equipmentLabel}
          onClose={onClose}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
};
export default FormCoachModal;
