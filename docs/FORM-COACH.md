# Form Coach (AI Pose Estimation Real-Time)

Fitur **Form Coach** di Ayo-Olahraga mendeteksi postur tubuh pengguna secara real-time langsung di dalam browser perangkat tanpa mengirim rekaman video atau citra ke server (100% pemrosesan lokal, offline-first, dan menjaga privasi).

---

## 1. Cara Kerja
1. **Inferensi On-Device**: Memanfaatkan `@mediapipe/tasks-vision` (model `PoseLandmarker Lite` berukuran ~5.5MB) yang dijalankan via WebAssembly offline dari `/mediapipe/wasm` dan `/models/pose_landmarker_lite.task`.
2. **Setup & Hitung Mundur**: Pengguna melihat panduan posisi (4 langkah), lalu menekan "Mulai" yang memicu hitung mundur 5 detik untuk mengambil posisi profil samping, diikuti kalibrasi baseline postur selama 1,5 detik.
3. **State Machine Repetisi**: `RepCounter` murni mendeteksi siklus gerak melalui tahapan `IDLE` $\rightarrow$ `DESCENDING` $\rightarrow$ `BOTTOM` $\rightarrow$ `ASCENDING` dengan ambang histeresis ganda dan filter durasi minimum (`minRepMs`) untuk mencegah bouncing akibat getaran sensor.
4. **Evaluasi Biomekanika**: Sudut 3D dihitung menggunakan fungsi vektor murni (`angleAt`, `angleFromVertical`) pada landmark sisi tubuh yang paling dominan menghadap kamera.
5. **Koreksi & Audio**: Umpan balik koreksi divalidasi dengan batas maksimal 2 pesan sekaligus, ditahan minimal 2,5 detik agar tidak berkedip, didukung sintesis suara opsional (`speechSynthesis` Bahasa Indonesia).

---

## 2. Aturan & Ambang Heuristik (`src/lib/pose/rules/config.ts`)

| Latihan | Metrik Utama | Aturan & Ambang Evaluasi | Cues Koreksi |
|---|---|---|---|
| **Squat** (`bw-air-squat`, `db-goblet-squat`, `kb-goblet-squat`, `bb-back-squat`) | Sudut Lutut<br>(Up > 160°, Down < 150°) | • **Depth**: lutut bottom $\ge 110^\circ$<br>• **Trunk Lean**: badan condong $> 45^\circ$ ($> 60^\circ$ back squat)<br>• **Heel Lift**: tumit naik $> 3\%$ tinggi badan<br>• **Descent Speed**: fase turun $< 1000\text{ ms}$ | "Turun lebih dalam, paha sejajar lantai"<br>"Dada lebih tegak"<br>"Tumit tetap menapak"<br>"Turun lebih terkontrol" |
| **Push-Up** (`bw-pushup`) | Sudut Siku<br>(Up > 155°, Down < 100°) | • **Depth**: siku bottom $> 100^\circ$<br>• **Hip Sag**: pinggul melorot & sudut $< 160^\circ$<br>• **Hip Pike**: pinggul naik $> 8\%$ tinggi badan<br>• **Lockout**: siku ekstensi $< 160^\circ$ di atas | "Turun lebih dalam, siku sekitar 90 derajat"<br>"Pinggul turun, kencangkan perut"<br>"Pinggul terlalu naik"<br>"Luruskan lengan di atas" |
| **Plank** (`bw-plank`) | Mode Hold<br>(Kontraksi Isometrik) | • **Hip Sag**: pinggul jatuh di bawah garis bahu-kaki<br>• **Hip Pike**: pinggul terangkat tinggi<br>• **Elbow Position**: deviasi siku vs bahu $> 10\%$ badan | "Pinggul turun, sejajarkan tubuh"<br>"Turunkan pinggul, tubuh lurus"<br>"Siku tepat di bawah bahu" |

> **Catatan Penting**: Seluruh nilai ambang sudut dan rasio di atas adalah **titik awal heuristik matematis**, bukan standar diagnosis medis. Ambang batas ini dirancang sebagai panduan edukasi dan perlu dikalibrasi berkala oleh pelatih kekuatan (*strength coach*) atau ahli fisioterapi sesuai anatomi pengguna.

---

## 3. Batasan Teknis
- **Sudut Pandang Terbatas (Single-View Side)**: Algoritma dirancang untuk sudut pandang samping murni (sagittal plane).
- **Punggung Membulat (Spinal Flexion)**: MediaPipe hanya melacak titik tulang belakang atas (bahu) dan bawah (pinggul). Kelengkungan tulang belakang torakal atau fleksi lumbal (*butt wink*) tidak dapat diukur secara andal dari titik-titik tersebut.
- **Siku Mengembang (Elbow Flaring)**: Pembengkakan siku ke arah luar kamera (frontal plane) sulit diukur secara akurat dari sudut samping tunggal.
- **Lintasan Barbel (3D Bar Path)**: Model melacak tubuh manusia, bukan objek logam/beban luar; deviasi horizontal barbel tidak dianalisis.
- **Pakaian Longgar**: Baju kedodoran dapat mengaburkan deteksi pinggul saat push-up atau plank (*false positive* hip sag).

---

## 4. Cara Menguji di Ponsel / HP

Akses kamera browser (`getUserMedia`) mewajibkan konteks aman (**HTTPS** atau `localhost`). Untuk menguji di HP melalui jaringan Wi-Fi lokal:

### Opsi A: Next.js HTTPS Experimental
Jalankan dev server dengan sertifikat SSL otomatis:
```bash
npx next dev --experimental-https
```
Buka URL `https://<IP-KOMPUTER-ANDA>:3000` di browser ponsel Anda (Chrome/Safari) dan setujui sertifikat lokal sementara.

### Opsi B: Tunneling (Cloudflare Tunnel / ngrok)
1. Jalankan `npm run dev` di PC (`http://localhost:3000`).
2. Buat tunnel HTTPS instan:
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   # atau
   npx ngrok http 3000
   ```
3. Buka tautan HTTPS yang dihasilkan di ponsel Anda.
