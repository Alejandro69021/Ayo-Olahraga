import { describe, it, expect } from "vitest";
import { angleAt, angleFromVertical, pickVisibleSide } from "../geometry";
import { LandmarkSmoother, smoothLandmark, smoothLandmarks } from "../smoothing";
import {
  Landmark,
  L_SHOULDER,
  R_SHOULDER,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
} from "../landmarks";

describe("geometry.ts", () => {
  it("angleAt: (0,1)-(0,0)-(1,0) = 90°", () => {
    const a: Landmark = { x: 0, y: 1, z: 0 };
    const b: Landmark = { x: 0, y: 0, z: 0 };
    const c: Landmark = { x: 1, y: 0, z: 0 };

    const angle = angleAt(a, b, c);
    expect(angle).toBeCloseTo(90, 5);
  });

  it("angleAt: tiga titik segaris = 180°", () => {
    const a: Landmark = { x: 0, y: 1, z: 0 };
    const b: Landmark = { x: 0, y: 0, z: 0 };
    const c: Landmark = { x: 0, y: -1, z: 0 };

    const angle = angleAt(a, b, c);
    expect(angle).toBeCloseTo(180, 5);
  });

  it("angleFromVertical: garis vertikal = 0° dari vertikal", () => {
    const top: Landmark = { x: 0, y: 0, z: 0 };
    const bottom: Landmark = { x: 0, y: 10, z: 0 };

    const angle = angleFromVertical(top, bottom);
    expect(angle).toBeCloseTo(0, 5);
  });

  it("angleFromVertical: garis horizontal = 90°", () => {
    const top: Landmark = { x: 0, y: 0, z: 0 };
    const bottom: Landmark = { x: 10, y: 0, z: 0 };

    const angle = angleFromVertical(top, bottom);
    expect(angle).toBeCloseTo(90, 5);
  });

  it("pickVisibleSide: memilih sisi dengan visibility lebih tinggi", () => {
    // Siapkan array 33 landmarks kosong
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 0.1,
    }));

    // Beri sisi kanan (right) nilai visibility lebih tinggi (0.9) dibanding sisi kiri (0.2)
    landmarks[L_SHOULDER].visibility = 0.2;
    landmarks[L_HIP].visibility = 0.2;
    landmarks[L_KNEE].visibility = 0.2;
    landmarks[L_ANKLE].visibility = 0.2;

    landmarks[R_SHOULDER].visibility = 0.9;
    landmarks[R_HIP].visibility = 0.9;
    landmarks[R_KNEE].visibility = 0.9;
    landmarks[R_ANKLE].visibility = 0.9;

    expect(pickVisibleSide(landmarks)).toBe("right");

    // Sekarang balikkan sisi kiri menjadi lebih tinggi (0.95)
    landmarks[L_SHOULDER].visibility = 0.95;
    landmarks[L_HIP].visibility = 0.95;
    landmarks[L_KNEE].visibility = 0.95;
    landmarks[L_ANKLE].visibility = 0.95;

    expect(pickVisibleSide(landmarks)).toBe("left");
  });
});

describe("smoothing.ts", () => {
  it("EMA konvergen ke nilai konstan", () => {
    const smoother = new LandmarkSmoother(0.3);

    // Titik awal
    let current: Landmark[] = [{ x: 0, y: 0, z: 0 }];
    smoother.smooth(current);

    // Masukkan nilai konstan target (10, 20, 30) berulang kali
    const target: Landmark[] = [{ x: 10, y: 20, z: 30 }];

    let result = current;
    for (let i = 0; i < 50; i++) {
      result = smoother.smooth(target);
    }

    // Harus konvergen mendekati nilai target
    expect(result[0].x).toBeCloseTo(10, 2);
    expect(result[0].y).toBeCloseTo(20, 2);
    expect(result[0].z).toBeCloseTo(30, 2);
  });

  it("smoothLandmark secara fungsional bekerja sesuai rumus", () => {
    const prev: Landmark = { x: 0, y: 0, z: 0 };
    const curr: Landmark = { x: 10, y: 10, z: 10 };
    const smoothed = smoothLandmark(curr, prev, 0.4);

    expect(smoothed.x).toBeCloseTo(4, 5);
    expect(smoothed.y).toBeCloseTo(4, 5);
    expect(smoothed.z).toBeCloseTo(4, 5);
  });
});
