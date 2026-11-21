"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "error";
export type FacingMode = "user" | "environment";

export interface UseCameraResult {
  stream: MediaStream | null;
  status: CameraStatus;
  error: string | null;
  facingMode: FacingMode;
  startCamera: (mode?: FacingMode) => Promise<void>;
  stopCamera: () => void;
  toggleFacingMode: () => void;
}

export function useCamera(initialFacingMode: FacingMode = "user"): UseCameraResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(initialFacingMode);

  const streamRef = useRef<MediaStream | null>(null);
  const wasActiveBeforeHiddenRef = useRef<boolean>(false);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const stopCamera = useCallback(() => {
    stopTracks();
    setStatus("idle");
    setError(null);
  }, [stopTracks]);

  const startCamera = useCallback(
    async (mode: FacingMode = facingMode) => {
      // 1. Validasi konteks aman (HTTPS atau localhost)
      if (typeof window !== "undefined") {
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "::1";

        if (!window.isSecureContext && !isLocalhost) {
          const msg = "Akses kamera memerlukan koneksi aman (HTTPS) atau lingkungan localhost.";
          setError(msg);
          setStatus("error");
          return;
        }
      }

      // 2. Validasi ketersediaan navigator.mediaDevices
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const msg = "Browser Anda tidak mendukung akses kamera perangkat (getUserMedia).";
        setError(msg);
        setStatus("error");
        return;
      }

      // Hentikan stream yang sedang berjalan bila ada
      stopTracks();
      setStatus("requesting");
      setError(null);

      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setFacingMode(mode);
        setStatus("ready");
      } catch (err: unknown) {
        let msg = "Gagal mengakses kamera perangkat.";
        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            msg = "Izin kamera ditolak. Harap izinkan akses kamera pada pengaturan perizinan browser Anda.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            msg = "Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera yang terhubung.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            msg = "Kamera sedang digunakan oleh aplikasi lain atau mengalami kendala perangkat keras.";
          } else if (err.name === "OverconstrainedError") {
            try {
              const fallbackStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              streamRef.current = fallbackStream;
              setStream(fallbackStream);
              setStatus("ready");
              return;
            } catch {
              msg = "Pengaturan resolusi atau posisi kamera tidak didukung perangkat.";
            }
          } else {
            msg = err.message || msg;
          }
        }
        setError(msg);
        setStatus("error");
      }
    },
    [facingMode, stopTracks]
  );

  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  // Hentikan kamera saat tab browser disembunyikan (background), nyalakan kembali saat tab aktif
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (streamRef.current) {
          wasActiveBeforeHiddenRef.current = true;
          stopTracks();
          setStatus("idle");
        }
      } else {
        if (wasActiveBeforeHiddenRef.current) {
          wasActiveBeforeHiddenRef.current = false;
          startCamera(facingMode);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [facingMode, startCamera, stopTracks]);

  // SELALU hentikan semua track saat komponen unmount (mematikan lampu indikator kamera)
  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, [stopTracks]);

  return {
    stream,
    status,
    error,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
  };
}
