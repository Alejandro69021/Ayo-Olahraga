KONTEKS PROYEK — baca penuh sebelum mengubah apa pun.

Repo: Ayo-Olahraga. Next.js 15 (App Router), React 19, TypeScript strict, Tailwind 3. Aplikasi pelacak latihan gym, seluruh teks UI berbahasa Indonesia.

File yang SUDAH ADA dan tidak boleh ditulis ulang:
- src/app/page.tsx (±1200 baris, monolit; edit seminimal mungkin, JANGAN refactor)
- src/data/exercises.ts (46 gerakan termasuk 4 gerakan di src/data/new-exercises.ts, tipe ExerciseDetail; id contoh: "bw-air-squat", "bw-pushup", "bw-plank", "bb-back-squat")
- src/components/TutorialModal.tsx, src/components/ProFeatureModal.tsx
- src/lib/offline-storage.ts (IndexedDB; tipe WorkoutSessionPayload, LoggedSet)
- Tema: warna volt #DFFF00, latar #080808, font class "font-metric" (Oswald).

FITUR BARU: "Form Coach". Kamera perangkat mendeteksi pose pengguna di dalam browser (MediaPipe PoseLandmarker, paket @mediapipe/tasks-vision), menghitung sudut sendi, menghitung repetisi, lalu memberi koreksi form berbahasa Indonesia secara real-time.

ATURAN KERAS:
1. Kerjakan HANYA fase yang diminta di prompt. Jangan menambah fitur lain.
2. Jangan mengubah file di luar daftar "BOLEH DIUBAH".
3. Tidak ada gambar/video kamera yang disimpan atau dikirim ke server. Hanya angka ringkasan yang boleh disimpan.
4. Logika sudut, penghitung repetisi, dan aturan koreksi harus FUNGSI MURNI di src/lib/pose/ tanpa import React atau DOM, supaya bisa dites.
5. Semua ambang sudut ada di src/lib/pose/rules/config.ts, bukan di komponen. Ambang itu titik awal heuristik, bukan standar medis.
6. Jangan menebak API MediaPipe. Jika ragu, baca dokumentasi resmi: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
7. Setelah selesai WAJIB menjalankan `npx tsc --noEmit` dan `npm run build`, perbaiki sampai bersih, lalu laporkan hasilnya apa adanya. Jangan menulis "lolos" jika belum dijalankan.
8. Akhiri dengan daftar file yang dibuat/diubah dan hal yang belum selesai.