"use client";

import { useState, useEffect } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export interface UsePoseLandmarkerResult {
  landmarker: PoseLandmarker | null;
  isReady: boolean;
  error: string | null;
  delegate: "GPU" | "CPU" | null;
}

// Module-level cache singleton: mencegah inisialisasi ulang model 5.5MB setiap kali modal dibuka/tutup
let cachedLandmarker: PoseLandmarker | null = null;
let cachedDelegate: "GPU" | "CPU" | null = null;
let landmarkerPromise: Promise<PoseLandmarker> | null = null;
let activeConsumers = 0;
let disposeTimer: NodeJS.Timeout | null = null;

async function getOrCreateLandmarker(): Promise<PoseLandmarker> {
  if (cachedLandmarker) {
    return cachedLandmarker;
  }

  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  landmarkerPromise = (async () => {
    // Muat WebAssembly offline dari direktori publik lokal
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

    let instance: PoseLandmarker;
    try {
      // 1. Coba delegasi GPU untuk performa real-time maksimal
      instance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      cachedDelegate = "GPU";
    } catch {
      // 2. Fallback aman ke CPU jika perangkat tidak mendukung akselerasi GPU
      instance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      cachedDelegate = "CPU";
    }

    cachedLandmarker = instance;
    landmarkerPromise = null;
    return instance;
  })();

  return landmarkerPromise;
}

export function usePoseLandmarker(): UsePoseLandmarkerResult {
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(cachedLandmarker);
  const [isReady, setIsReady] = useState<boolean>(cachedLandmarker !== null);
  const [error, setError] = useState<string | null>(null);
  const [delegate, setDelegate] = useState<"GPU" | "CPU" | null>(cachedDelegate);

  useEffect(() => {
    let isCancelled = false;
    activeConsumers++;

    // Batalkan rencana penutupan instance jika modal dibuka kembali
    if (disposeTimer) {
      clearTimeout(disposeTimer);
      disposeTimer = null;
    }

    if (cachedLandmarker) {
      setLandmarker(cachedLandmarker);
      setIsReady(true);
      setDelegate(cachedDelegate);
    } else {
      getOrCreateLandmarker()
        .then((instance) => {
          if (!isCancelled) {
            setLandmarker(instance);
            setIsReady(true);
            setDelegate(cachedDelegate);
          }
        })
        .catch((err: unknown) => {
          if (!isCancelled) {
            const msg = err instanceof Error ? err.message : "Gagal memuat model deteksi pose.";
            setError(msg);
          }
        });
    }

    return () => {
      isCancelled = true;
      activeConsumers--;

      // Jika tidak ada komponen yang menggunakan model dalam 60 detik, bersihkan memori WebAssembly
      if (activeConsumers <= 0 && cachedLandmarker) {
        disposeTimer = setTimeout(() => {
          if (activeConsumers <= 0 && cachedLandmarker) {
            try {
              cachedLandmarker.close();
            } catch {}
            cachedLandmarker = null;
            cachedDelegate = null;
          }
        }, 60000);
      }
    };
  }, []);

  return { landmarker, isReady, error, delegate };
}
