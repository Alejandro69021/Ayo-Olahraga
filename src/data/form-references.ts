/**
 * Registri rujukan Form Coach — Ayo-Olahraga
 *
 * ATURAN: hanya entri di file ini yang boleh dipakai sebagai "dasar ilmiah" di UI atau di aturan form.
 * Dilarang menambah/mengubah entri dari ingatan model. Tambah entri baru hanya setelah URL-nya dibuka
 * dan isinya dibaca manusia.
 *
 * Setiap entri hanya mengklaim apa yang tertulis di abstrak/halaman sumber saat diperiksa (21 Nov 2026).
 * Hampir semua studi di sini adalah EMG atau biomekanika. Mereka mendukung ARAH dan ALASAN sebuah
 * pemeriksaan form, BUKAN angka batas derajat. Angka batas tetap heuristik (lihat rules/config.ts).
 */

export type ReferenceKind =
  | "EMG"
  | "biomekanik"
  | "kinematika"
  | "ulasan"
  | "validitas-pose";

export interface FormReference {
  id: string;
  cite: string; // sitasi singkat
  url: string;
  kind: ReferenceKind;
  supports: string; // apa yang didukung (sesuai sumber)
  caveat?: string; // batas / catatan kejujuran
}

export const FORM_REFERENCES = [
  // ───────────── SQUAT & SPLIT SQUAT ─────────────
  {
    id: "schoenfeld-2010",
    cite: "Schoenfeld BJ (2010). Squatting kinematics and kinetics and their application to exercise performance. J Strength Cond Res 2010;24:3497–3506.",
    url: "https://pubmed.ncbi.nlm.nih.gov/20182386/",
    kind: "ulasan",
    supports: "Memahami kinematika dan kinetika squat penting untuk performa dan mengurangi risiko cedera latihan.",
    caveat: "Ulasan umum; tidak memberi ambang derajat spesifik untuk deteksi kamera.",
  },
  {
    id: "straub-powers-2024",
    cite: "Straub RK, Powers CM (2024). A Biomechanical Review of the Squat Exercise: Implications for Clinical Practice. Int J Sports Phys Ther 19(4):490–501.",
    url: "https://pubmed.ncbi.nlm.nih.gov/38576836/",
    kind: "ulasan",
    supports: "Squat dapat diubah lewat posisi batang tubuh, posisi tibia, rotasi kaki, lebar stance, dan kedalaman; condong batang tubuh ke depan menggeser momen dari lutut ke pinggul.",
    caveat: "Menegaskan teknik squat bervariasi antar individu; kondisi 'condong' bukan otomatis salah.",
  },
  {
    id: "hartmann-2013",
    cite: "Ulasan literatur kedalaman squat (Hartmann dkk.), Sports Medicine 2013, doi 10.1007/s40279-013-0073-6.",
    url: "https://www.doi.org/10.1007/s40279-013-0073-6",
    kind: "ulasan",
    supports: "Menilai apakah squat dangkal lebih aman daripada squat dalam (lebih dari 164 artikel ditinjau).",
    caveat: "Sebuah ulasan lain merangkum bahwa squat dalam tidak menaikkan risiko pada lutut, pinggul, atau tulang belakang.",
  },
  {
    id: "myer-2014",
    cite: "Myer GD dkk. (2014). Penilaian teknik back squat (PMC4262933).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4262933",
    kind: "ulasan",
    supports: "Kerangka penilaian posisi awal dan kedalaman back squat, termasuk posisi batang tubuh sejajar tibia dengan lumbal sedikit lordotik.",
  },
  {
    id: "akd-review-2023",
    cite: "The Limitations of Anterior Knee Displacement during Different Barbell Squat Techniques: A Comprehensive Review. J Clin Med 12(8):2955.",
    url: "https://www.mdpi.com/2077-0383/12/8/2955/html",
    kind: "ulasan",
    supports: "Membatasi pergeseran lutut ke depan mengubah koordinasi lutut-pinggul, menambah condong tubuh, menambah fleksi batang tubuh, dan mengurangi kedalaman. Squat dalam tampak aman bila tulang belakang netral.",
    caveat: "Karena itu aplikasi TIDAK boleh menandai 'lutut melewati ujung jari kaki' sebagai kesalahan.",
  },
  {
    id: "farrokhi-2008",
    cite: "Farrokhi S dkk. (2008). Trunk position influences the kinematics, kinetics, and muscle activity of the lead lower extremity during the forward lunge exercise. J Orthop Sports Phys Ther 38(7):403–409.",
    url: "https://pubmed.ncbi.nlm.nih.gov/18591759/",
    kind: "biomekanik",
    supports: "Lunge dengan batang tubuh condong ke depan meningkatkan impuls dan rekrutmen ekstensor pinggul.",
    caveat: "Condong ke depan di lunge adalah pilihan penekanan otot, bukan kesalahan per se.",
  },
  {
    id: "lunge-trunk-2021",
    cite: "Influence of Trunk Position during Three Lunge Exercises on Muscular Activation in Trained Women (PMC8136561).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8136561/",
    kind: "EMG",
    supports: "Batang tubuh condong meningkatkan aktivasi erector spinae lumbal bawah; lunge dinamis memberi aktivasi gluteus maximus lebih besar daripada statis.",
  },
  {
    id: "deforest-2014",
    cite: "DeForest BA dkk. (2014). Muscle Activity in Single- vs. Double-Leg Squats. Int J Exerc Sci 7(4):302–310.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4831851",
    kind: "EMG",
    supports: "Membandingkan aktivitas otot, perpindahan vertikal, dan gaya reaksi lantai pada back squat, rear-leg elevated split squat, dan split squat.",
  },
  {
    id: "mackey-riemann-2021",
    cite: "Mackey ER, Riemann BL (2021). Biomechanical Differences Between the Bulgarian Split-Squat and Back Squat. Int J Exerc Sci 14(1):533–543.",
    url: "https://digitalcommons.wku.edu/ijes/vol14/iss1/10",
    kind: "biomekanik",
    supports: "Bulgarian split squat dan back squat sama-sama dominan pinggul; perpindahan lutut lebih kecil pada split squat.",
  },

  // ───────────── DEADLIFT / HINGE / KETTLEBELL ─────────────
  {
    id: "ramirez-2022",
    cite: "Ramirez VJ, Bazrgari B, Gao F, Samaan M (2022). Low Back Biomechanics during Repetitive Deadlifts: A Narrative Review. IISE Trans Occup Ergon Hum Factors 10(1):34–46.",
    url: "https://pubmed.ncbi.nlm.nih.gov/34875981/",
    kind: "ulasan",
    supports: "Beban geser tulang belakang pada deadlift berat melampaui ambang rekomendasi cedera lumbal di konteks kerja.",
    caveat: "Konteks okupasi/militer; tidak menetapkan sudut kamera.",
  },
  {
    id: "deadlift-lumbar-2022",
    cite: "Studi observasional keselarasan tulang belakang lumbal saat deadlift pada lifter pria dan wanita (PMC9528690).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9528690",
    kind: "kinematika",
    supports: "Dari berdiri ke posisi awal deadlift, lordosis lumbal berkurang sekitar 13° (atas) dan 20° (bawah); penyesuaian terjadi di tiga bidang gerak.",
    caveat: "Menunjukkan lengkung lumbal berubah normal saat deadlift. Karena itu kamera 2D tidak boleh menilai 'punggung bulat'.",
  },
  {
    id: "mcgill-marshall-2012",
    cite: "McGill SM, Marshall LW (2012). Kettlebell swing, snatch, and bottoms-up carry: back and hip muscle activation, motion, and low back loads. J Strength Cond Res 26(1):16–27.",
    url: "https://www.backfitpro.com/medical-scientific-articles/2012/[63]McGill,S.(2012)Kettlebell-swing-snatch-and-bottoms-up-carry[J.Strength-Condit.Res.].pdf",
    kind: "biomekanik",
    supports: "Ayunan kettlebell menciptakan pola hip-hinge squat dengan siklus aktivasi-relaksasi otot yang cepat.",
  },
  {
    id: "andersen-2019-swing",
    cite: "Andersen V dkk. (2019). Trunk Muscle Activity in One- and Two-Armed American Kettlebell Swing in Resistance-Trained Men. Sports Med Int Open 3(1):E12–E18.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6428676",
    kind: "EMG",
    supports: "Pada American swing, titik akhir kettlebell berada vertikal di atas kepala sehingga batang tubuh menahan hiperekstensi dan/atau rotasi.",
  },

  // ───────────── PRESS ─────────────
  {
    id: "green-comfort-2007",
    cite: "Green CM, Comfort P (2007). The effect of grip width on bench press performance and risk of injury. Strength Cond J 29(5):10–14.",
    url: "https://lida.sport-iat.de/ta/Record/4013441?lng=en",
    kind: "ulasan",
    supports: "Genggaman lebih dari 1,5 kali lebar bahu (biacromial) dapat menaikkan risiko cedera bahu; ≤1,5 kali lebar bahu menurunkan risiko dengan selisih 1RM ≤5%.",
  },
  {
    id: "noteboom-2024",
    cite: "Noteboom L dkk. (2024). Effects of bench press technique variations on musculoskeletal shoulder loads and potential injury risk. Front Physiol 15:1393235.",
    url: "https://pubmed.ncbi.nlm.nih.gov/38974522/",
    kind: "biomekanik",
    supports: "Genggaman <1,5 lebar bahu dan retraksi skapula menurunkan gaya geser posterior glenohumeral dan aktivitas rotator cuff; genggaman lebih sempit menurunkan kompresi akromioklavikular.",
    caveat: "Model muskuloskeletal pada 10 atlet kekuatan; bukan data kamera.",
  },
  {
    id: "rodriguez-ridao-2020",
    cite: "Rodríguez-Ridao D dkk. (2020). Effect of Five Bench Inclinations on the Electromyographic Activity of the Pectoralis Major, Anterior Deltoid, and Triceps Brachii during the Bench Press Exercise. Int J Environ Res Public Health 17(19):7339.",
    url: "https://pubmed.ncbi.nlm.nih.gov/33049982/",
    kind: "EMG",
    supports: "Kemiringan bench di atas 45° meningkatkan aktivasi deltoid anterior secara signifikan dan menurunkan kinerja otot dada; 30° mengaktifkan dada atas lebih besar.",
    caveat: "Teks di exercises.ts menyebut batas 60° untuk incline dumbbell; jurnal ini mendukung 45°.",
  },
  {
    id: "saeterbakken-fimland-2013",
    cite: "Saeterbakken AH, Fimland MS (2013). Effects of body position and loading modality on muscle activity and strength in shoulder presses. J Strength Cond Res 27(7):1824–1831.",
    url: "https://pubmed.ncbi.nlm.nih.gov/23096062/",
    kind: "EMG",
    supports: "Membandingkan shoulder press barbel/dumbel, duduk/berdiri; latihan dengan tuntutan stabilitas tertinggi (berdiri, dumbel) menunjukkan aktivitas deltoid tertinggi.",
    caveat: "Tidak menetapkan batas lengkung punggung bawah.",
  },
  {
    id: "coratella-2022-ohp",
    cite: "Coratella G dkk. (2022). Front vs Back and Barbell vs Machine Overhead Press: An Electromyographic Analysis. Front Physiol 13:825880.",
    url: "https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.825880/pdf",
    kind: "EMG",
    supports: "Overhead press di belakang kepala meningkatkan eksitasi deltoid medial/posterior; di depan lebih menguntungkan pectoralis major; barbel mengeksitasi otot lebih dari mesin.",
  },
  {
    id: "kb-ohp-2018",
    cite: "Stability of Resistance Training Implement alters EMG Activity during the Overhead Press. Int J Exerc Sci 11(1):708–716 (2018).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6033506",
    kind: "EMG",
    supports: "Pusat massa kettlebell berada di belakang sendi glenohumeral saat overhead press, sehingga kettlebell dianggap implemen yang kurang stabil dibanding dumbel.",
  },

  // ───────────── ROW & PULL-UP ─────────────
  {
    id: "fenwick-2009",
    cite: "Fenwick CMJ, Brown SHM, McGill SM (2009). Comparison of different rowing exercises: trunk muscle activation and lumbar spine motion, load, and stiffness. J Strength Cond Res 23(2):350–358.",
    url: "https://pubmed.ncbi.nlm.nih.gov/19197209/",
    kind: "biomekanik",
    supports: "Bent-over row memberi aktivasi simetris di seluruh punggung tetapi menghasilkan beban tulang belakang lumbal terbesar; 1-armed cable row menantang kemampuan torsi batang tubuh.",
  },
  {
    id: "saeterbakken-2015-row",
    cite: "Saeterbakken A dkk. (2015). The Effect of Performing Bi- and Unilateral Row Exercises on Core Muscle Activation. Int J Sports Med 36:900–905.",
    url: "https://www.thieme-connect.com/products/ejournals/pdf/10.1055/s-0034-1398646.pdf",
    kind: "EMG",
    supports: "Free-weight row memberi aktivitas erector spinae lebih tinggi daripada mesin; pelaksanaan unilateral menuntut oblik eksternal lebih besar.",
  },
  {
    id: "prinold-bull-2016",
    cite: "Prinold JAI, Bull AMJ (2016). Scapula kinematics of pull-up techniques: Avoiding impingement risk with training changes. J Sci Med Sport 19(8):629–635.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26383875/",
    kind: "kinematika",
    supports: "Pull-up genggaman lebar dan genggaman terbalik menunjukkan pola kinematika yang dikaitkan dengan risiko impingement lebih tinggi.",
  },
  {
    id: "dickie-2017",
    cite: "Dickie JA dkk. (2017). Electromyographic analysis of muscle activation during pull-up variations. J Electromyogr Kinesiol 32:30–36.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28011412/",
    kind: "EMG",
    supports: "Membandingkan aktivasi otot bahu-lengan-bawah lengan pada variasi pull-up pada 19 pria terlatih.",
  },
  {
    id: "williamson-price-2021",
    cite: "Williamson & Price (2021). Studi EMG pull-up strict vs kipping vs butterfly. St Mary's University (repositori).",
    url: "https://research.stmarys.ac.uk/id/eprint/4703/1/Williamson-Price-2021.pdf",
    kind: "EMG",
    supports: "Kipping dan butterfly pull-up memakai posisi tubuh hollow dan arched untuk menciptakan momentum sebelum melewati palang.",
  },

  // ───────────── PUSH-UP & DIPS ─────────────
  {
    id: "cogley-2005",
    cite: "Cogley RM dkk. (2005). Comparison of muscle activation using various hand positions during the push-up exercise. J Strength Cond Res 19(3):628–633.",
    url: "https://www.proquest.com/docview/213066347",
    kind: "EMG",
    supports: "Posisi tangan sempit memberi aktivasi pectoralis major dan triceps brachii lebih besar daripada posisi lebar.",
  },
  {
    id: "marcolin-2015",
    cite: "Marcolin G dkk. (2015). Selective Activation of Shoulder, Trunk, and Arm Muscles: A Comparative Analysis of Different Push-Up Variants. J Athl Train 50(11):1126–1132.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26488636/",
    kind: "EMG",
    supports: "Posisi tangan sempit meningkatkan aktivasi triceps dan pectoralis major; menggeser tangan ke depan/belakang meningkatkan aktivasi otot perut dan punggung.",
  },
  {
    id: "pushup-scoping-2022",
    cite: "Scoping review variasi push-up dan tingkat aktivasi otot (PMC9121296).",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9121296",
    kind: "ulasan",
    supports: "Merangkum variasi push-up umum dan aktivasi otot masing-masing (enam tipe push-up, lima otot).",
    caveat: "Tidak membahas pike push-up secara khusus.",
  },
  {
    id: "mckenzie-2022-dips",
    cite: "McKenzie A dkk. (2022). Bench, Bar, and Ring Dips: Do Kinematics and Muscle Activity Differ? Int J Environ Res Public Health 19(20):13211.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9603242/",
    kind: "kinematika",
    supports: "Bench dip menuntut ekstensi bahu lebih besar; bar dip adalah progresi yang tepat dari bench dip karena aktivasi puncak lebih tinggi.",
  },
  {
    id: "mckenzie-2022-fatigue",
    cite: "McKenzie A dkk. (2022). Fatigue Increases Muscle Activations but Does Not Change Maximal Joint Angles during the Bar Dip. Int J Environ Res Public Health 19(21):14390.",
    url: "https://pubmed.ncbi.nlm.nih.gov/36361276/",
    kind: "kinematika",
    supports: "Kelelahan memperpanjang durasi repetisi dan menggeser posisi bawah lebih awal; sudut sendi maksimum tidak berubah signifikan.",
  },

  // ───────────── CORE / POSTERIOR CHAIN ─────────────
  {
    id: "mcgill-2010-core",
    cite: "McGill S (2010). Core training: Evidence translating to better performance and injury prevention. Strength Cond J 32(3):33–47.",
    url: "https://www.backfitpro.com/medical-scientific-articles/2010/[70]McGill,S.M.(2010)Core-training[J.Strength-and-Condit.].pdf",
    kind: "ulasan",
    supports: "Latihan inti yang baik penting untuk performa dan pencegahan cedera; melatih inti berbeda dengan melatih otot anggota gerak.",
  },
  {
    id: "escamilla-2006",
    cite: "Escamilla RF dkk. (2006). Electromyographic analysis of traditional and nontraditional abdominal exercises: implications for rehabilitation and training. Phys Ther 86(5):656–671.",
    url: "https://pubmed.ncbi.nlm.nih.gov/16649890/",
    kind: "EMG",
    supports: "Hanging knee-up dengan strap termasuk latihan dengan aktivasi rectus abdominis atas/bawah dan oblik internal tertinggi.",
    caveat: "Menggunakan strap; hanging knee-up tanpa strap bisa berbeda.",
  },
  {
    id: "mcgill-2014-anterior",
    cite: "McGill S, Andersen J, Cannon J (2014). Muscle activity and spine load during anterior chain whole body linkage exercises: the body saw, hanging leg raise and walkout from a push-up. J Sports Sci.",
    url: "https://www.backfitpro.com/medical-scientific-articles/2014/%5B28%5DMcGill%2CS.%282014%29Muscle-activity-and-spine-load-during-anterior-chain-whole-body-linkage-exercises%5BJ.Sport-Sci.%5D.pdf",
    kind: "biomekanik",
    supports: "Mengukur aktivitas otot dan beban tulang belakang pada hanging leg raise, body saw, dan walkout dari push-up.",
  },
  {
    id: "plank-legraise-2019",
    cite: "Which trunk exercise most effectively activates abdominal muscles? A comparative study of plank and isometric bilateral leg raise exercises. J Back Musculoskelet Rehabil 32(5):797–802 (2019).",
    url: "https://pubmed.ncbi.nlm.nih.gov/30856100/",
    kind: "EMG",
    supports: "Membandingkan aktivasi rectus abdominis, oblik internal, dan erector spinae pada plank dengan posisi pinggul berbeda dan leg raise isometrik.",
  },
  {
    id: "contreras-2015",
    cite: "Contreras B dkk. (2015). A Comparison of Gluteus Maximus, Biceps Femoris, and Vastus Lateralis EMG Activity in the Back Squat and Barbell Hip Thrust. J Appl Biomech 31(6):452–458.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26214739/",
    kind: "EMG",
    supports: "Barbell hip thrust memberi aktivasi gluteus maximus atas/bawah dan biceps femoris lebih besar daripada back squat pada wanita terlatih.",
    caveat: "Hip thrust berbeban, bukan glute bridge bodyweight.",
  },
  {
    id: "gmax-review-2020",
    cite: "Gluteus Maximus Activation during Common Strength and Hypertrophy Exercises: A Systematic Review. J Sports Sci Med 19(1):195–203 (2020).",
    url: "https://pubmed.ncbi.nlm.nih.gov/32132843/",
    kind: "ulasan",
    supports: "Tinjauan sistematis aktivasi gluteus maximus pada latihan kekuatan dengan ekstensi pinggul dan beban eksternal.",
  },
  {
    id: "triceps-surae-knee-2002",
    cite: "Selective recruitment of the triceps surae muscles with changes in knee angle. J Strength Cond Res 16(3):433–439 (2002).",
    url: "https://pubmed.ncbi.nlm.nih.gov/12173959/",
    kind: "EMG",
    supports: "Medial gastrocnemius paling aktif pada lutut lurus 180° dibanding soleus; sudut lutut dapat dipakai untuk menargetkan soleus atau gastrocnemius.",
  },
  {
    id: "heel-raise-2012",
    cite: "Influence of knee flexion angle and age on triceps surae muscle activity during heel raises. J Strength Cond Res 26(11):3124–3133 (2012).",
    url: "https://pubmed.ncbi.nlm.nih.gov/22190157/",
    kind: "EMG",
    supports: "Heel raise disarankan dengan lutut lurus untuk gastrocnemius dan lutut ditekuk untuk soleus.",
    caveat: "Penulis menyebut seberapa selektif otot pada posisi itu belum jelas.",
  },
  {
    id: "gastroc-torque-1995",
    cite: "Influence of gastrocnemius muscle length on triceps surae torque development and electromyographic activity in man (PubMed 7498381).",
    url: "https://pubmed.ncbi.nlm.nih.gov/7498381/",
    kind: "biomekanik",
    supports: "Torsi plantar-fleksi maksimal turun hingga 60% pada fleksi lutut ekstrem dibanding lutut lurus; kontribusi gastrocnemius berkurang saat lutut menekuk.",
  },
  {
    id: "superman-emg",
    cite: "EMG longissimus thoracis dan multifidus pada latihan rehabilitasi punggung, termasuk Superman (PubMed 19195137).",
    url: "https://www.pubmed.gov/19195137/",
    kind: "EMG",
    supports: "Ekstensi prone dengan lengan dan tungkai terangkat (Superman) menghasilkan EMG sekitar 77–82% MVIC; latihan ekstremitas prone/quadruped di bawah 50% MVIC.",
  },
  {
    id: "dafkou-2021",
    cite: "Dafkou K, Kellis E, Ellinoudis A, Sahinis C (2021). Studi ketebalan kontraksi otot multifidus lumbal pada variasi superman dan bird dog. Int J Exerc Sci 14(7):101–112.",
    url: "https://digitalcommons.wku.edu/ijes/vol14/iss7/2",
    kind: "EMG",
    supports: "Superman dengan lengan dan tungkai terangkat (UL) tampak paling efektif untuk ketebalan kontraksi multifidus.",
  },

  // ───────────── LENGAN & BAHU ISOLASI ─────────────
  {
    id: "oliveira-2009",
    cite: "Oliveira LF dkk. (2009). Effect of the shoulder position on the biceps brachii EMG in different dumbbell curls. J Sports Sci Med 8(1):24–29.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3737788/",
    kind: "EMG",
    supports: "Incline dumbbell curl dan dumbbell curl klasik memberi pola aktivasi biceps serupa sepanjang rentang gerak; preacher curl aktif tinggi hanya pada rentang sudut siku pendek.",
  },
  {
    id: "marcolin-2018",
    cite: "Marcolin G dkk. (2018). Differences in electromyographic activity of biceps brachii and brachioradialis while performing three variants of curl. PeerJ 6:e5165.",
    url: "https://pubmed.ncbi.nlm.nih.gov/30013836",
    kind: "EMG",
    supports: "Aktivasi biceps dan brachioradialis lebih tinggi pada curl EZ dibanding dumbbell curl; perbedaan straight vs EZ kecil sehingga pilihan soal kenyamanan.",
  },
  {
    id: "curl-handgrip-2023",
    cite: "Biceps Brachii and Brachioradialis Excitation in Biceps Curl Exercise: Different Handgrips, Different Synergy. Sports (Basel) 11(3):64 (2023).",
    url: "https://pubmed.ncbi.nlm.nih.gov/36976950/",
    kind: "EMG",
    supports: "Genggaman supinasi menghasilkan eksitasi biceps lebih besar dibanding pronasi (+19%) dan netral (+12%) pada fase naik.",
    caveat: "Orientasi genggaman tidak terbaca andal oleh pose 2D.",
  },
  {
    id: "campos-2020",
    cite: "Campos YAC dkk. (2020). Different Shoulder Exercises Affect the Activation of Deltoid Portions in Resistance-Trained Individuals. J Hum Kinet 75:5–14.",
    url: "https://pubmed.ncbi.nlm.nih.gov/33312291/",
    kind: "EMG",
    supports: "Shoulder press dan lateral raise memberi aktivasi deltoid anterior dan medial lebih tinggi dibanding bench press dan dumbbell fly; lateral raise tertinggi untuk deltoid posterior.",
  },
  {
    id: "lateral-raise-2020",
    cite: "An Electromyographic Analysis of Lateral Raise Variations and Frontal Raise in Competitive Bodybuilders. Int J Environ Res Public Health 17(17):6015 (2020).",
    url: "https://www.mdpi.com/1660-4601/17/17/6015",
    kind: "EMG",
    supports: "Rotasi eksternal humerus menaikkan aktivasi deltoid anterior dan medial; rotasi internal menaikkan deltoid posterior, triceps, dan trapezius atas; frontal raise terutama mengaktifkan deltoid anterior dan pectoralis major.",
  },
  {
    id: "deltoid-exercises-2023",
    cite: "Muscle Activation of Different Deltoid Exercises. Kinesiologia Slovenica 29(1):73–87 (2023).",
    url: "https://dlib.si/stream/URN:NBN:SI:DOC-63TWD41Q/2e95c487-5065-496e-b21c-ffacb8494bb3/PDF",
    kind: "EMG",
    supports: "Membandingkan dumbbell front raise, lateral raise (dua variasi rentang gerak), dan rear delt raise (dua variasi genggaman) pada 14 pria terlatih.",
  },

  // ───────────── CARRY ─────────────
  {
    id: "winwood-2014",
    cite: "Winwood PW dkk. (2014). A biomechanical analysis of the farmers walk, and comparison with the deadlift and unloaded walk. Int J Sports Sci Coaching 9(5).",
    url: "https://core.ac.uk/download/196601726.pdf",
    kind: "biomekanik",
    supports: "Farmers walk berbeda signifikan dari berjalan tanpa beban dan deadlift pada sudut batang tubuh, sudut paha, dan lutut.",
  },
  {
    id: "mcgill-strongman-2009",
    cite: "Comparison of different strongman events: trunk muscle activation and lumbar spine motion, load, and stiffness. J Strength Cond Res 23(4):1148–1161 (2009).",
    url: "https://pubmed.ncbi.nlm.nih.gov/19528856/",
    kind: "biomekanik",
    supports: "Mendokumentasikan tuntutan punggung dan batang tubuh pada farmer's walk, suitcase carry, dan acara strongman lain.",
  },
  {
    id: "loaded-carry-2024",
    cite: "The Quantification of Muscle Activation During the Loaded Carry Movement Pattern. Int J Exerc Sci 17(1):480–490 (2024).",
    url: "https://pubmed.ncbi.nlm.nih.gov/38665162/",
    kind: "EMG",
    supports: "Loaded carry mengaktifkan otot inti pada banyak bidang gerak saat tubuh bergerak.",
  },

  // ───────────── VALIDITAS POSE ESTIMATION ─────────────
  {
    id: "pose-resistance-arxiv-2026",
    cite: "Markerless Pose Estimation for Resistance Training Technique Assessment (arXiv 2608.24384).",
    url: "https://arxiv.org/pdf/2608.24384",
    kind: "validitas-pose",
    supports: "BlazePose merekonstruksi lintasan sudut sendi squat dan deadlift dari video biasa; estimasi sudut 2D sangat sensitif terhadap distorsi perspektif dan rekaman non-sagital dapat menyesatkan.",
    caveat: "Pracetak (arXiv); belum tentu telah melalui peer review.",
  },
  {
    id: "blazepose-knee-jmir-2026",
    cite: "Yue XA, Gu Y, Yu B. Validation of Single-Camera MediaPipe BlazePose for Knee Joint Angle Measurement Across Multiple Functional Tasks. JMIR Rehabil Assist Technol 2026;13:e102399.",
    url: "https://preprints.jmir.org/preprint/102399",
    kind: "validitas-pose",
    supports: "Kesepakatan statis dengan goniometri: ICC 0,874, RMSE 15,49°. Pada uji stres semua keluaran, ICC squat turun menjadi 0,428 dan RMSE naik dari 8,78° menjadi 25,43°.",
    caveat: "Tertaut sebagai pracetak; memakai model BlazePose Heavy, bukan Lite. Dasar untuk menetapkan toleransi minimal ±10–15°.",
  },
  {
    id: "pose-clinical-arxiv-2025",
    cite: "Validation of Human Pose Estimation and Human Mesh Recovery for Extracting Clinically Relevant Motion Data from Videos (arXiv 2503.14760).",
    url: "https://arxiv.org/pdf/2503.14760",
    kind: "validitas-pose",
    supports: "Pada sit-to-stand, sudut lutut puncak MediaPipe lebih rendah daripada IMU dan MoCap; pada squat to box, MediaPipe memulai dan mengakhiri sekitar 15° di bawah IMU dan MoCap.",
    caveat: "Pracetak (arXiv).",
  },
  {
    id: "pose-viewangle-2025",
    cite: "Pengaruh sudut pandang kamera terhadap validitas estimasi sudut sendi (lutut, pinggul, siku, bahu) dari pose estimation. Sensors 25(3):799 (2025).",
    url: "https://mdpi.com/1424-8220/25/3/799",
    kind: "validitas-pose",
    supports: "Membandingkan data kinematika pose estimation dengan motion capture berbasis marker untuk mengukur efek sudut pandang kamera.",
  },
] as const satisfies readonly FormReference[];

export type FormReferenceId = (typeof FORM_REFERENCES)[number]["id"];

export const FORM_REFERENCE_MAP: Record<string, FormReference> = Object.fromEntries(
  FORM_REFERENCES.map((r) => [r.id, r])
);
