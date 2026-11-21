import { Severity, IssueItem, RepResult } from "./rules/types";

/**
 * PENGURANGAN SKOR BERDASARKAN SEVERITY:
 * - Critical: -25 (risiko cedera tinggi / form rusak fatal)
 * - Major: -15 (kesalahan biomekanika utama)
 * - Minor: -8 (penyimpangan tempo / form ringan)
 */
export const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  critical: 25,
  major: 15,
  minor: 8,
};

/**
 * Menghitung skor repetisi dari daftar isu form yang terdeteksi.
 * Skor berawal dari 100 dan dikurangi per isu unik (maksimal 1 penalti per checkId per rep).
 * Batas bawah skor adalah 0.
 */
export function calculateRepScore(issues: IssueItem[]): number {
  if (!issues || issues.length === 0) {
    return 100;
  }

  // Gunakan Map agar checkId yang sama tidak dikenakan penalti ganda dalam satu repetisi
  const uniqueIssues = new Map<string, Severity>();
  for (const issue of issues) {
    const existing = uniqueIssues.get(issue.checkId);
    if (!existing) {
      uniqueIssues.set(issue.checkId, issue.severity);
    } else {
      // Ambil severity terparah jika terdeteksi berulang
      const rank: Record<Severity, number> = { minor: 1, major: 2, critical: 3 };
      if (rank[issue.severity] > rank[existing]) {
        uniqueIssues.set(issue.checkId, issue.severity);
      }
    }
  }

  let totalDeduction = 0;
  for (const severity of uniqueIssues.values()) {
    totalDeduction += SEVERITY_DEDUCTIONS[severity];
  }

  return Math.max(0, 100 - totalDeduction);
}

/**
 * Menghitung skor rata-rata untuk keseluruhan sesi latihan repetisi.
 */
export function calculateAverageScore(reps: RepResult[]): number {
  if (!reps || reps.length === 0) return 0;
  const scoredReps = reps.filter((r) => typeof r.score === "number");
  if (scoredReps.length === 0) return 0;
  const total = scoredReps.reduce((sum, r) => sum + (r.score ?? 0), 0);
  return Math.round(total / scoredReps.length);
}

/**
 * Menghitung skor untuk latihan mode hold (seperti plank) berbasis persentase waktu tahan bersih.
 *
 * @param cleanHoldMs Durasi tahanan form bersih (tanpa pelanggaran)
 * @param totalHoldMs Total durasi latihan hold
 * @returns Persentase skor 0–100
 */
export function calculateHoldScore(cleanHoldMs: number, totalHoldMs: number): number {
  if (totalHoldMs <= 0) return 0;
  const percentage = (cleanHoldMs / totalHoldMs) * 100;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}
