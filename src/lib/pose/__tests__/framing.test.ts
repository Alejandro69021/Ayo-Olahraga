import { describe, it, expect } from "vitest";
import { checkFraming } from "../framing";
import {
  Landmark,
  L_SHOULDER,
  R_SHOULDER,
  L_ELBOW,
  R_ELBOW,
  L_WRIST,
  R_WRIST,
  L_HIP,
  R_HIP,
  L_ANKLE,
  R_ANKLE,
} from "../landmarks";

describe("framing.ts", () => {
  const required = [L_SHOULDER, R_SHOULDER, L_HIP, R_HIP];

  it("ok: true ketika seluruh landmark terlihat di dalam frame 0–1 dan visibility >= 0.5", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));

    const result = checkFraming(landmarks, required);
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.message).toContain("Posisi tubuh ideal");
  });

  it("ok: false ketika landmark berada di luar batas (x < 0 atau y > 1)", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));

    // Bahu kiri keluar frame kiri
    landmarks[L_SHOULDER] = { x: -0.1, y: 0.5, z: 0, visibility: 0.9 };
    // Pinggul kanan keluar frame bawah
    landmarks[R_HIP] = { x: 0.5, y: 1.2, z: 0, visibility: 0.9 };

    const result = checkFraming(landmarks, required);
    expect(result.ok).toBe(false);
    expect(result.missing).toContain(L_SHOULDER);
    expect(result.missing).toContain(R_HIP);
    expect(result.message).toContain("Mundur sedikit");
  });

  it("ok: false ketika visibility < 0.5", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));

    // Bahu kanan tertutup / visibility rendah
    landmarks[R_SHOULDER].visibility = 0.3;

    const result = checkFraming(landmarks, required);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([R_SHOULDER]);
  });

  it("ok: false ketika landmarks kosong atau null", () => {
    const resultNull = checkFraming(null, required);
    expect(resultNull.ok).toBe(false);
    expect(resultNull.missing).toEqual(required);
    expect(resultNull.message).toContain("Tubuh tidak terdeteksi");

    const resultEmpty = checkFraming([], required);
    expect(resultEmpty.ok).toBe(false);
    expect(resultEmpty.missing).toEqual(required);
  });

  it("view side: kiri lengkap, siku/pergelangan kanan visibility 0.2 -> ok", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));
    const sideReq = [
      L_SHOULDER,
      R_SHOULDER,
      L_ELBOW,
      R_ELBOW,
      L_WRIST,
      R_WRIST,
      L_HIP,
      R_HIP,
      L_ANKLE,
      R_ANKLE,
    ];
    landmarks[R_ELBOW].visibility = 0.2;
    landmarks[R_WRIST].visibility = 0.2;

    const result = checkFraming(landmarks, sideReq, "side");
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("view side: kedua sisi tidak lengkap -> tidak ok, missing dari kelompok lebih lengkap", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));
    const sideReq = [
      L_SHOULDER,
      R_SHOULDER,
      L_ELBOW,
      R_ELBOW,
      L_WRIST,
      R_WRIST,
      L_HIP,
      R_HIP,
      L_ANKLE,
      R_ANKLE,
    ];
    // Kiri kurang 1 (L_ANKLE), kanan kurang 2 (R_ELBOW, R_WRIST) -> kiri lebih lengkap
    landmarks[L_ANKLE].visibility = 0.2;
    landmarks[R_ELBOW].visibility = 0.2;
    landmarks[R_WRIST].visibility = 0.2;

    const result = checkFraming(landmarks, sideReq, "side");
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([L_ANKLE]);
  });

  it("view front dengan kanan rusak -> tetap tidak ok", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));
    const sideReq = [
      L_SHOULDER,
      R_SHOULDER,
      L_ELBOW,
      R_ELBOW,
      L_WRIST,
      R_WRIST,
      L_HIP,
      R_HIP,
      L_ANKLE,
      R_ANKLE,
    ];
    landmarks[R_ELBOW].visibility = 0.2;
    landmarks[R_WRIST].visibility = 0.2;

    const result = checkFraming(landmarks, sideReq, "front");
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([R_ELBOW, R_WRIST]);
  });

  it("tanpa parameter view -> perilaku lama (salah satu sisi rusak tetap tidak ok)", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.9,
    }));
    const sideReq = [
      L_SHOULDER,
      R_SHOULDER,
      L_ELBOW,
      R_ELBOW,
      L_WRIST,
      R_WRIST,
      L_HIP,
      R_HIP,
      L_ANKLE,
      R_ANKLE,
    ];
    landmarks[R_ELBOW].visibility = 0.2;
    landmarks[R_WRIST].visibility = 0.2;

    const result = checkFraming(landmarks, sideReq);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([R_ELBOW, R_WRIST]);
  });
});
