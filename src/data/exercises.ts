import { ExerciseAttributeValueEnum } from "@/components/muscles/types";

export interface ExerciseDetail {
  id: string;
  name: string;
  equipment: "barbell" | "dumbbell" | "bodyweight" | "kettlebell" | "plate";
  equipmentLabel: string;
  primaryMuscle: ExerciseAttributeValueEnum;
  primaryMuscleCode: string;
  primaryMuscleName: string;
  secondaryMuscles: ExerciseAttributeValueEnum[];
  secondaryMuscleNames: string[];
  difficulty: "Pemula" | "Menengah" | "Lanjutan";
  videoUrl: string;
  fullVideoImageUrl: string;
  summary: string;
  tutorial: {
    setup: string[];
    movement: string[];
    breathing: string;
    mistakes: string[];
    proTip: string;
  };
}

export const EXERCISES_DATABASE: ExerciseDetail[] = [
  // ==================== BARBELL ====================
  {
    id: "bb-bench-press",
    name: "Barbell Flat Bench Press",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada (Pectoralis)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Triceps", "Bahu Depan"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/OZYybDMR2i4",
    fullVideoImageUrl: "https://img.youtube.com/vi/OZYybDMR2i4/hqdefault.jpg",
    summary: "Latihan kompaun utama untuk membangun ketebalan serat dada, triceps, dan deltoid anterior dengan stabilisasi beban bilateral.",
    tutorial: {
      setup: [
        "Berbaring telentang di bench dengan mata tepat sejajar di bawah palang barbel.",
        "Rapatkan kedua tulang belikat (retract scapula) dan kencangkan pijakan telapak kaki ke lantai.",
        "Pegang barbel selebar 1.5x lebar bahu dengan ibu jari melingkar mengunci (safe grip)."
      ],
      movement: [
        "Angkat barbel dari rak, stabilkan tepat di atas garis dada.",
        "Turunkan barbel terkontrol (2-3 detik) hingga menyentuh dada bagian tengah (garis puting).",
        "Dorong barbel kembali ke atas dengan mengontraksikan otot dada, hindari mengunci siku secara kasar."
      ],
      breathing: "Tarik napas saat menurunkan barbel ke dada, hembuskan napas kuat saat mendorong barbel ke atas.",
      mistakes: [
        "Siku melebar 90 derajat sejajar bahu (risiko tinggi cedera rotator cuff). Arahkan siku 45-70 derajat.",
        "Pantat terangkat dari bench saat mendorong beban berat.",
        "Memantulkan barbel ke tulang dada."
      ],
      proTip: "Bayangkan Anda sedang mencoba mematahkan barbel menjadi dua untuk mengaktifkan otot lats dan menstabilkan sendi bahu."
    }
  },
  {
    id: "bb-back-squat",
    name: "Barbell Back Squat",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan (Quads)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Paha Belakang", "Perut (Core)"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/H5VYU6t_w9o",
    fullVideoImageUrl: "https://img.youtube.com/vi/H5VYU6t_w9o/hqdefault.jpg",
    summary: "Raja latihan kaki untuk melatih paha depan (quadriceps), pinggul (glutes), dan kekuatan kinetik seluruh tubuh.",
    tutorial: {
      setup: [
        "Letakkan barbel di atas otot trapezius punggung atas (bukan di tulang leher).",
        "Buka kaki selebar bahu dengan jari kaki sedikit membuka keluar (15-30 derajat).",
        "Kencangkan otot perut (brace core) seolah menahan benturan."
      ],
      movement: [
        "Dorong pinggul ke belakang sambil menekuk lutut seolah hendak duduk di kursi.",
        "Turun hingga paha sejajar lantai (paralel) dengan dada tetap tegak.",
        "Tekan tumit ke lantai untuk mendorong tubuh kembali berdiri tegak."
      ],
      breathing: "Tarik napas dalam di perut sebelum turun, hembuskan napas setelah melewati titik berat ke atas.",
      mistakes: [
        "Lutut menekuk ke dalam (knee cave/valgus). Pastikan arah lutut selalu sejajar dengan arah jari kaki.",
        "Tumit terangkat dari lantai saat posisi bawah."
      ],
      proTip: "Jaga dada tetap membusung tegap dan pandangan lurus ke depan selama repetisi."
    }
  },
  {
    id: "bb-bent-row",
    name: "Barbell Bent-Over Row",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.BACK,
    primaryMuscleCode: "B",
    primaryMuscleName: "Punggung (Lats)",
    secondaryMuscles: [ExerciseAttributeValueEnum.BICEPS, ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Biceps", "Pundak Atas (Traps)", "Bahu Belakang"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/jOr03vOvMH0",
    fullVideoImageUrl: "https://img.youtube.com/vi/jOr03vOvMH0/hqdefault.jpg",
    summary: "Latihan penebal otot punggung utama untuk merangsang latissimus dorsi, rhomboids, dan fleksor siku.",
    tutorial: {
      setup: [
        "Berdiri dengan kaki selebar bahu, tekuk sedikit lutut dan dorong pinggul ke belakang (hinge) hingga tubuh condong 45 derajat.",
        "Pegang barbel selebar bahu dengan telapak tangan menghadap ke bawah (overhand grip).",
        "Jaga tulang belakang netral dan kunci otot core."
      ],
      movement: [
        "Tarik barbel ke arah pusar / perut bawah dengan memimpin menggunakan siku.",
        "Rapatkan kedua tulang belikat di titik puncak kontraksi dan tahan 1 detik.",
        "Turunkan barbel secara perlahan hingga lengan lurus terentang."
      ],
      breathing: "Tarik napas di bawah, hembuskan napas saat menarik beban ke perut.",
      mistakes: [
        "Punggung membungkuk melengkung (risiko cedera lumbar).",
        "Mengayunkan pinggul secara berlebihan (momentum cheating)."
      ],
      proTip: "Fokuskan tarikan pada siku yang ditarik ke belakang kantong celana, bukan hanya menarik dengan telapak tangan."
    }
  },
  {
    id: "bb-reverse-lunges",
    name: "Barbell Alternating Reverse Lunges",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan (Quads)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.CALVES],
    secondaryMuscleNames: ["Pantat (Glutes)", "Paha Belakang", "Betis"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/NmfQzqGktgs",
    fullVideoImageUrl: "https://img.youtube.com/vi/NmfQzqGktgs/hqdefault.jpg",
    summary: "Latihan unilateral efektif untuk melatih keseimbangan, kekuatan otot paha, dan stabilitas panggul.",
    tutorial: {
      setup: [
        "Posisikan barbel melintang aman di punggung atas (trapezius).",
        "Berdiri tegak dengan kaki selebar pinggul dan pandangan lurus ke depan."
      ],
      movement: [
        "Langkahkan satu kaki ke belakang sekitar 60-90 cm.",
        "Turunkan pinggul hingga lutut depan membentuk sudut 90 derajat dan lutut belakang hampir menyentuh lantai.",
        "Dorong lantai melalui tumit kaki depan untuk kembali ke posisi berdiri awal, lalu ganti kaki bergantian."
      ],
      breathing: "Tarik napas saat melangkah mundur ke bawah, hembuskan napas saat mendorong kembali ke atas.",
      mistakes: [
        "Badan terlalu condong ke depan sehingga lutut depan melewati ujung jari kaki secara berlebihan.",
        "Kehilangan keseimbangan karena posisi kaki belakang terlalu segaris lurus dengan kaki depan."
      ],
      proTip: "Bayangkan Anda melangkah di atas dua rel kereta terpisah agar keseimbangan tetap kokoh."
    }
  },
  {
    id: "bb-deadlift",
    name: "Barbell Conventional Deadlift",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.HAMSTRINGS,
    primaryMuscleCode: "H",
    primaryMuscleName: "Paha Belakang (Hamstrings)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.BACK, ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Punggung Bawah", "Traps", "Lengan Bawah"],
    difficulty: "Lanjutan",
    videoUrl: "https://www.youtube.com/embed/o5FvhPAZ_yw",
    fullVideoImageUrl: "https://img.youtube.com/vi/o5FvhPAZ_yw/hqdefault.jpg",
    summary: "Latihan kekuatan total tubuh terhebat yang melatih seluruh rantai posterior tubuh dari tumit hingga leher.",
    tutorial: {
      setup: [
        "Berdiri dengan kaki selebar pinggul, palang barbel memotong tepat di tengah telapak kaki (midfoot).",
        "Condongkan pinggul ke belakang dan raih barbel tepat di luar garis lutut.",
        "Bawa tulang kering menyentuh barbel, busungkan dada, dan kunci punggung lurus netral."
      ],
      movement: [
        "Tekan lantai menjauh menggunakan telapak kaki (leg press the floor).",
        "Jaga palang barbel tetap menempel dekat di sepanjang tulang kering dan paha saat naik.",
        "Kunci pinggul tegak di posisi atas dengan mengontraksikan glutes tanpa melengkungkan pinggang ke belakang (hyperextension)."
      ],
      breathing: "Tarik napas dalam di perut dan kunci (Valsalva) sebelum mengangkat, hembuskan napas di posisi atas.",
      mistakes: [
        "Punggung melengkung bulat seperti udang saat menarik beban dari lantai.",
        "Barbel melayang jauh dari tubuh sehingga membebani tulang lumbar."
      ],
      proTip: "Pikirkan gerakan ini sebagai mendorong bumi ke bawah menggunakan kaki, bukan sekadar mengangkat beban dengan tangan."
    }
  },

  // ==================== DUMBBELL ====================
  {
    id: "db-bench-press",
    name: "Dumbbell Flat Bench Press",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada (Pectoralis)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Triceps", "Bahu Depan"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/c5MKgisg9Us",
    fullVideoImageUrl: "https://img.youtube.com/vi/c5MKgisg9Us/hqdefault.jpg",
    summary: "Memberikan rentang gerak (range of motion) lebih luas dibanding barbel dan memperbaiki ketidakseimbangan kekuatan antara dada kiri dan kanan.",
    tutorial: {
      setup: [
        "Duduk di ujung bench dengan dumbel diletakkan di atas paha.",
        "Tendangkan paha ke atas untuk membantu meletakkan dumbel di sisi dada saat Anda berbaring telentang.",
        "Buka siku 45-60 derajat dari tubuh, rapatkan tulang belikat."
      ],
      movement: [
        "Dorong dumbel ke atas mengikuti lengkungan alami hingga kedua dumbel mendekat di atas dada.",
        "Turunkan dumbel secara perlahan hingga merasakan peregangan yang nyaman di otot dada.",
        "Jaga kontrol penuh di bagian bawah sebelum mendorong kembali."
      ],
      breathing: "Tarik napas saat menurunkan dumbel, hembuskan napas saat mendorong ke atas.",
      mistakes: [
        "Membenturkan kedua dumbel di atas (menghilangkan tegangan otot).",
        "Menurunkan siku terlalu dalam hingga menarik sendi bahu secara ekstrem."
      ],
      proTip: "Fokuskan pada merapatkan kedua bisep ke arah dada saat di puncak gerakan untuk kontraksi maksimal."
    }
  },
  {
    id: "db-incline-press",
    name: "Incline Dumbbell Bench Press",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada Bagian Atas",
    secondaryMuscles: [ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.TRICEPS],
    secondaryMuscleNames: ["Bahu Depan", "Triceps"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/J98frFHqcI0",
    fullVideoImageUrl: "https://img.youtube.com/vi/J98frFHqcI0/hqdefault.jpg",
    summary: "Latihan isolasi terfokus pada serat klavikular dada atas dan deltoid anterior dengan sudut bench 30-45 derajat.",
    tutorial: {
      setup: [
        "Atur sudut incline bench di kemiringan 30 hingga 45 derajat.",
        "Bawa dumbel ke dada dengan bantuan lutut saat bersandar.",
        "Kunci scapula dan jaga pijakan kaki tetap menjejak kuat ke lantai."
      ],
      movement: [
        "Dorong dumbel ke atas dan sedikit ke dalam hingga lengan terentang stabil.",
        "Turunkan beban terkontrol dalam 2-3 detik hingga sejajar garis dada atas.",
        "Ulangi gerakan dengan irama stabil."
      ],
      breathing: "Tarik napas saat menurunkan beban, hembuskan napas saat mendorong ke atas.",
      mistakes: [
        "Kemiringan bench terlalu tegak (>60 derajat) sehingga kerja dada berpindah ke bahu.",
        "Membiarkan pergelangan tangan tertekuk ke belakang."
      ],
      proTip: "Gunakan sudut 30 derajat jika ingin aktivasi dada atas maksimal tanpa membebani sendi bahu berlebih."
    }
  },
  {
    id: "db-floor-press",
    name: "Single-Arm Dumbbell Floor Press",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada & Triceps",
    secondaryMuscles: [ExerciseAttributeValueEnum.ABDOMINALS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Core / Perut", "Bahu"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/uF42bGLRFZA",
    fullVideoImageUrl: "https://img.youtube.com/vi/uF42bGLRFZA/hqdefault.jpg",
    summary: "Latihan ramah sendi bahu yang melatih stabilitas dada, triceps, serta otot rotasi core (anti-rotation).",
    tutorial: {
      setup: [
        "Berbaring telentang di lantai dengan lutut ditekuk dan telapak kaki menapak rata.",
        "Pegang dumbel di satu tangan dengan siku bertumpu di lantai pada sudut 45 derajat."
      ],
      movement: [
        "Dorong dumbel lurus ke atas hingga siku hampir mengunci.",
        "Tahan kontraksi dada di puncak selama 1 detik.",
        "Turunkan perlahan hingga lengan belakang menyentuh lantai tanpa melepaskan ketegangan otot."
      ],
      breathing: "Hembuskan napas saat mendorong dumbel ke atas, tarik napas saat menurunkan ke lantai.",
      mistakes: [
        "Membiarkan badan miring atau pinggul terangkat akibat beban tidak seimbang.",
        "Menghentakkan siku ke lantai secara keras."
      ],
      proTip: "Kencangkan otot perut dan tekan punggung bawah ke lantai untuk melatih kekuatan core secara bersamaan."
    }
  },
  {
    id: "db-bicep-curl",
    name: "Dumbbell Bicep Curl",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.BICEPS,
    primaryMuscleCode: "Bi",
    primaryMuscleName: "Lengan Depan (Biceps)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Lengan Bawah (Brachioradialis)"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/affG2o3MHog",
    fullVideoImageUrl: "https://img.youtube.com/vi/affG2o3MHog/hqdefault.jpg",
    summary: "Latihan isolasi klasik untuk membangun ukuran dan puncak (peak) otot bisep dengan gerakan supinasi penuh.",
    tutorial: {
      setup: [
        "Berdiri tegak dengan sepasang dumbel di samping paha, telapak tangan menghadap ke dalam (neutral grip).",
        "Rapatkan siku di samping pinggang dan busungkan dada."
      ],
      movement: [
        "Angkat dumbel sambil memutar pergelangan tangan keluar (supinasi) hingga telapak tangan menghadap ke atas di puncak gerakan.",
        "Remas otot bisep kuat-kuat di posisi atas selama 1 detik.",
        "Turunkan beban dengan tempo lambat (2-3 detik) kembali ke posisi semula."
      ],
      breathing: "Hembuskan napas saat mengangkat dumbel, tarik napas saat menurunkan beban.",
      mistakes: [
        "Mengayunkan punggung atau pinggul ke depan untuk mengangkat beban.",
        "Siku bergerak maju ke depan menjauhi pinggang."
      ],
      proTip: "Kunci siku Anda di satu titik seolah terpaku di pinggang agar isolasi otot bisep terjadi 100%."
    }
  },
  {
    id: "db-lateral-raise",
    name: "Dumbbell Lateral Raise",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu Samping (Lateral Deltoid)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRAPS],
    secondaryMuscleNames: ["Trapezius"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/WtP691z7Wz8",
    fullVideoImageUrl: "https://img.youtube.com/vi/WtP691z7Wz8/hqdefault.jpg",
    summary: "Kunci utama menciptakan ilusi bahu lebar dan postur V-Taper yang proporsional.",
    tutorial: {
      setup: [
        "Berdiri tegak dengan dumbel di samping tubuh, sedikit condongkan badan ke depan (10 derajat).",
        "Tekuk siku sangat sedikit (sekitar 15 derajat) dan kunci posisi siku tersebut."
      ],
      movement: [
        "Angkat dumbel ke samping tubuh dengan mengarahkan siku ke atas hingga setinggi bahu.",
        "Bayangkan Anda sedang menuangkan air dari teko di puncak gerakan.",
        "Tahan sejenak lalu turunkan terkontrol perlahan."
      ],
      breathing: "Hembuskan napas saat mengangkat ke samping, tarik napas saat menurunkan beban.",
      mistakes: [
        "Menggunakan beban terlalu berat sehingga mengangkat dengan bantuan mengayunkan badan.",
        "Mengangkat tangan lebih tinggi dari siku (memindahkan beban ke otot leher/traps)."
      ],
      proTip: "Pikirkan mendorong beban menjauh ke arah dinding samping ruangan, bukan sekadar mengangkatnya ke atas."
    }
  },
  {
    id: "db-goblet-squat",
    name: "Dumbbell Goblet Squat",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan (Quads)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Perut (Core)"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/H5VYU6t_w9o",
    fullVideoImageUrl: "https://img.youtube.com/vi/H5VYU6t_w9o/hqdefault.jpg",
    summary: "Variasi squat terbaik untuk pemula yang melatih kedalaman squat dengan postur dada yang tegak sempurna.",
    tutorial: {
      setup: [
        "Pegang satu dumbel secara vertikal tepat di depan dada menggunakan kedua telapak tangan.",
        "Buka kaki sedikit lebih lebar dari bahu dengan ujung jari kaki sedikit mengarah keluar."
      ],
      movement: [
        "Duduk ke bawah di antara kedua kaki, jaga siku berada di bagian dalam lutut di posisi bawah.",
        "Turunkan pinggul hingga sejajar atau sedikit di bawah lutut.",
        "Dorong lantai melalui seluruh telapak kaki untuk kembali berdiri tegak."
      ],
      breathing: "Tarik napas saat turun, tahan sejenak di bawah, lalu hembuskan napas kuat saat berdiri.",
      mistakes: [
        "Dada condong jatuh ke depan sehingga membebani pinggang bawah.",
        "Beban dumbel menjauh dari dada."
      ],
      proTip: "Beban di depan dada berfungsi sebagai penyeimbang alami yang memudahkan Anda berjongkok lebih dalam tanpa kehilangan keseimbangan."
    }
  },

  // ==================== BODYWEIGHT ====================
  {
    id: "bw-sky-divers",
    name: "Superman / Sky Divers",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.BACK,
    primaryMuscleCode: "B",
    primaryMuscleName: "Punggung Bawah (Erector Spinae)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.HAMSTRINGS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Paha Belakang"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/_zFTo8AzHUg",
    fullVideoImageUrl: "https://img.youtube.com/vi/_zFTo8AzHUg/hqdefault.jpg",
    summary: "Latihan fantastis untuk menguatkan seluruh otot rantai posterior (erector spinae, glutes, hamstrings) dan mencegah sakit pinggang.",
    tutorial: {
      setup: [
        "Berbaring tengkurap di atas matras dengan tangan lurus di depan kepala dan kaki lurus ke belakang.",
        "Arahkan pandangan ke bawah ke arah matras untuk menjaga leher tetap sejajar netral dengan tulang belakang."
      ],
      movement: [
        "Secara simultan, angkat lengan, dada, dan kedua paha beberapa centimeter dari lantai.",
        "Kontraksikan otot punggung bawah dan remas otot glutes sekuat mungkin di posisi terangkat.",
        "Tahan posisi melayang (sky diver) selama 2-3 detik, lalu turunkan kembali secara perlahan ke matras."
      ],
      breathing: "Tarik napas saat berada di lantai, hembuskan napas kuat saat mengangkat tubuh ke atas.",
      mistakes: [
        "Mendongakkan kepala terlalu tinggi ke belakang (menjepit sendi leher).",
        "Menahan napas saat posisi terangkat."
      ],
      proTip: "Fokuskan pada memanjangkan tubuh sejauh mungkin dari ujung jari tangan hingga ujung jari kaki saat terangkat."
    }
  },
  {
    id: "bw-diamond-pushup",
    name: "Diamond Push-Up",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.TRICEPS,
    primaryMuscleCode: "T",
    primaryMuscleName: "Lengan Belakang (Triceps)",
    secondaryMuscles: [ExerciseAttributeValueEnum.CHEST, ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Dada Bagian Dalam", "Bahu Depan", "Core"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/dluhsF6hP2w",
    fullVideoImageUrl: "https://img.youtube.com/vi/dluhsF6hP2w/hqdefault.jpg",
    summary: "Variasi push-up intensif yang memaksimalkan isolasi beban pada ketiga kepala otot triceps dan dada bagian dalam.",
    tutorial: {
      setup: [
        "Ambil posisi plank tinggi dengan kedua telapak tangan didekatkan tepat di bawah dada.",
        "Satukan ujung ibu jari dan telunjuk hingga membentuk pola segitiga / berlian (diamond).",
        "Kunci otot perut dan glutes agar tubuh membentuk satu garis lurus kokoh."
      ],
      movement: [
        "Turunkan dada perlahan ke arah celah berlian di antara kedua tangan.",
        "Jaga siku tetap mengarah ke belakang dekat ke samping tubuh.",
        "Dorong lantai kuat-kuat melalui telapak tangan untuk kembali ke posisi awal."
      ],
      breathing: "Tarik napas saat menurunkan badan, hembuskan napas saat mendorong ke atas.",
      mistakes: [
        "Siku melebar keluar ke samping (memberikan tekanan berlebih pada siku dan pergelangan tangan).",
        "Pinggul melorot ke lantai."
      ],
      proTip: "Jika terlalu berat di awal, lakukan dengan bertumpu pada lutut terlebih dahulu sebelum beralih ke tumpuan jari kaki."
    }
  },
  {
    id: "bw-plyo-pushup",
    name: "Plyometric Push-Up",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada (Eksplosif)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Triceps", "Bahu"],
    difficulty: "Lanjutan",
    videoUrl: "https://www.youtube.com/embed/D6lNvOYDkYw",
    fullVideoImageUrl: "https://img.youtube.com/vi/D6lNvOYDkYw/hqdefault.jpg",
    summary: "Latihan daya ledak (explosive power) tingkat lanjut untuk melatih refleks motorik cepat pada otot dada dan triceps.",
    tutorial: {
      setup: [
        "Mulai dari posisi push-up standar dengan tangan sedikit lebih lebar dari bahu.",
        "Kencangkan seluruh tubuh dari kepala hingga tumit kaki."
      ],
      movement: [
        "Turunkan dada dengan tempo terkendali hingga hampir menyentuh lantai.",
        "Dorong lantai sekuat dan secepat mungkin hingga kedua tangan terangkat lepas dari lantai di posisi atas.",
        "Mendarat dengan lembut menggunakan telapak tangan dan segera tekuk siku untuk menyerap benturan secara elastis."
      ],
      breathing: "Tarik napas saat turun, hembuskan napas eksplosif saat mendorong tubuh melayang.",
      mistakes: [
        "Mendarat dengan siku terkunci kaku (sangat berbahaya bagi sendi).",
        "Punggung melengkung saat dorongan ledak."
      ],
      proTip: "Prioritaskan kecepatan dan pendaratan yang mulus daripada seberapa tinggi tangan Anda melayang."
    }
  },
  {
    id: "bw-pushup",
    name: "Standard Push-Up",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada (Pectoralis)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Triceps", "Bahu Depan", "Perut (Core)"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/qpcBos-EUug",
    fullVideoImageUrl: "https://img.youtube.com/vi/qpcBos-EUug/hqdefault.jpg",
    summary: "Fondasi calisthenics terbaik untuk membangun kekuatan dorong dada, lengan, dan stabilitas inti tubuh.",
    tutorial: {
      setup: [
        "Posisikan tangan sedikit lebih lebar dari bahu dengan jari menghadap ke depan.",
        "Kencangkan perut dan pantat, tubuh lurus sempurna seperti papan."
      ],
      movement: [
        "Turunkan dada hingga berjarak 2-3 cm dari lantai.",
        "Siku membentuk sudut 45 derajat (panah) dari tubuh, bukan berbentuk T.",
        "Dorong lantai menjauh hingga lengan lurus kembali."
      ],
      breathing: "Tarik napas saat menurunkan tubuh, hembuskan napas kuat saat mendorong naik.",
      mistakes: [
        "Pinggul melorot ke bawah atau pantat terlalu menungging tinggi.",
        "Kepala menunduk ke lantai sebelum dada turun."
      ],
      proTip: "Cengkeram lantai dengan jari-jari tangan untuk mengaktifkan otot stabilisator lengan atas."
    }
  },
  {
    id: "bw-pullup",
    name: "Overhand Grip Pull-Up",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.BACK,
    primaryMuscleCode: "B",
    primaryMuscleName: "Punggung (Latissimus Dorsi)",
    secondaryMuscles: [ExerciseAttributeValueEnum.BICEPS, ExerciseAttributeValueEnum.FOREARMS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Biceps", "Lengan Bawah", "Core"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/swLoMW9WFZI",
    fullVideoImageUrl: "https://img.youtube.com/vi/swLoMW9WFZI/hqdefault.jpg",
    summary: "Raja latihan tarik tubuh bagian atas untuk melebarkan punggung dan menguatkan daya cengkeram tangan.",
    tutorial: {
      setup: [
        "Pegang pull-up bar dengan telapak tangan menghadap ke depan (pronasi), lebih lebar dari bahu.",
        "Gantungkan tubuh penuh (dead hang), lalu aktifkan belikat dengan menariknya ke bawah (active hang)."
      ],
      movement: [
        "Tarik dada ke arah palang dengan memimpin menggunakan siku ke bawah pinggang.",
        "Tarik hingga dagu melewati palang bar.",
        "Turunkan tubuh dengan kontrol penuh hingga lengan kembali lurus sempurna."
      ],
      breathing: "Hembuskan napas saat menarik badan ke atas, tarik napas saat menurunkan tubuh.",
      mistakes: [
        "Mengayunkan kaki atau menendang (kipping) untuk membantu tarikan.",
        "Rentang gerak setengah-setengah (half rep)."
      ],
      proTip: "Bayangkan Anda sedang menarik siku ke kantong celana belakang untuk aktivasi lats maksimal."
    }
  },
  {
    id: "bw-hanging-knees",
    name: "Hanging Knee Raise",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.ABDOMINALS,
    primaryMuscleCode: "Ab",
    primaryMuscleName: "Perut Bawah (Lower Abs)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS, ExerciseAttributeValueEnum.OBLIQUES],
    secondaryMuscleNames: ["Lengan Bawah / Grip", "Pinggang Samping"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/qVsbO098ueU",
    fullVideoImageUrl: "https://img.youtube.com/vi/qVsbO098ueU/hqdefault.jpg",
    summary: "Latihan core gantung yang sangat efektif mengisolasi otot perut bawah dan fleksor panggul tanpa membebani leher.",
    tutorial: {
      setup: [
        "Gantung lurus di pull-up bar dengan kedua lengan selebar bahu.",
        "Stabilkan tubuh agar tidak berayun dan aktifkan otot perut."
      ],
      movement: [
        "Angkat kedua lutut ke arah dada dengan menggulung panggul ke atas (pelvic tilt).",
        "Tahan kontraksi di puncak selama 1 detik.",
        "Turunkan kaki perlahan tanpa membiarkan tubuh mengayun maju-mundur."
      ],
      breathing: "Hembuskan napas saat lutut naik ke dada, tarik napas saat kaki turun kembali.",
      mistakes: [
        "Menggunakan momentum ayunan tubuh untuk melempar lutut ke atas.",
        "Hanya mengangkat kaki tanpa menggulung pinggul ke atas."
      ],
      proTip: "Fokuskan pada mendekatkan tulang ekor ke arah pusar agar serat perut bawah bekerja maksimal."
    }
  },
  {
    id: "bw-bench-hops",
    name: "Bench Hops / Sauts Alternés",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.CALVES,
    primaryMuscleCode: "Ca",
    primaryMuscleName: "Betis & Paha (Agility)",
    secondaryMuscles: [ExerciseAttributeValueEnum.QUADRICEPS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Paha Depan", "Core"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/R3TCOHRwCl8",
    fullVideoImageUrl: "https://img.youtube.com/vi/R3TCOHRwCl8/hqdefault.jpg",
    summary: "Latihan kelincahan kardio dan pliometrik untuk meningkatkan daya ledak kaki, betis, dan daya tahan jantung.",
    tutorial: {
      setup: [
        "Berdiri di samping bench atau kotak rendah dengan kaki selebar pinggul.",
        "Condongkan badan sedikit ke depan dan tekuk lutut bersiap melompat."
      ],
      movement: [
        "Lompat melompati bench dari satu sisi ke sisi lain secara ritmis.",
        "Mendarat dengan lembut di atas bola telapak kaki dan segera pantulkan kembali.",
        "Jaga ritme napas yang teratur selama repetisi."
      ],
      breathing: "Napas berirama teratur setiap 1-2 lompatan.",
      mistakes: [
        "Mendarat dengan lutut kaku lurus.",
        "Menabrak sisi bench karena kurang tinggi melompat."
      ],
      proTip: "Gunakan ayunan kedua lengan untuk membantu momentum vertikal dan menjaga keseimbangan tubuh."
    }
  },
  {
    id: "bw-facepulls",
    name: "Facepulls (Tirage Horizontal)",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu Belakang & Postur",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.BACK],
    secondaryMuscleNames: ["Upper Back", "Rotator Cuff"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/3ZViIERC1QQ",
    fullVideoImageUrl: "https://img.youtube.com/vi/3ZViIERC1QQ/hqdefault.jpg",
    summary: "Latihan koreksi postur terbaik untuk menguatkan deltoid posterior, rhomboids, dan kesehatan sendi bahu.",
    tutorial: {
      setup: [
        "Gunakan tali suspensi / kabel setinggi mata atau wajah.",
        "Pegang ujung pegangan dengan ibu jari menghadap ke belakang."
      ],
      movement: [
        "Tarik pegangan lurus ke arah wajah (antara hidung dan dahi).",
        "Putar pergelangan tangan ke luar di akhir tarikan sehingga siku tetap tinggi sejajar bahu.",
        "Rapatkan kedua tulang belikat kuat-kuat dan tahan 1-2 detik sebelum kembali perlahan."
      ],
      breathing: "Tarik napas di awal, hembuskan napas kuat saat menarik pegangan ke wajah.",
      mistakes: [
        "Membiarkan siku turun ke bawah pinggang saat menarik.",
        "Mengayunkan pinggang ke depan untuk menambah gaya dorong."
      ],
      proTip: "Pikirkan gerakan double-bicep pose di akhir tarikan untuk aktivasi rotator cuff yang optimal."
    }
  },

  // ==================== KETTLEBELL ====================
  {
    id: "kb-swing",
    name: "Russian Kettlebell Swing",
    equipment: "kettlebell",
    equipmentLabel: "Kettlebell",
    primaryMuscle: ExerciseAttributeValueEnum.HAMSTRINGS,
    primaryMuscleCode: "H",
    primaryMuscleName: "Paha Belakang (Hamstrings)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.BACK, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Punggung Bawah", "Core"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/7OSBcLGaXIU",
    fullVideoImageUrl: "https://img.youtube.com/vi/7OSBcLGaXIU/hqdefault.jpg",
    summary: "Latihan daya ledak pinggul (hip hinge) yang membakar kalori tinggi sekaligus memperkuat postur rantai posterior tubuh.",
    tutorial: {
      setup: [
        "Berdiri dengan kaki selebar bahu, kettlebell diletakkan di lantai 30 cm di depan Anda.",
        "Tekuk pinggul ke belakang (bukan jongkok) dengan punggung lurus dan raih handle kettlebell."
      ],
      movement: [
        "Ayunkan kettlebell ke belakang di antara kedua selangkangan paha (seperti operan bola rugby).",
        "Dorong pinggul ke depan secara eksplosif hingga berdiri tegak lurus sempurna.",
        "Biarkan kettlebell mengapung naik setinggi dada karena daya dorong pinggul, bukan ditarik tangan."
      ],
      breathing: "Tarik napas saat kettlebell berayun ke bawah, hembuskan napas eksplosif (hissing) saat pinggul mengunci ke depan.",
      mistakes: [
        "Melakukan squat (menekuk lutut terlalu dalam) alih-alih hip hinge.",
        "Mengangkat beban menggunakan otot bahu dan lengan.",
        "Punggung melengkung di posisi bawah."
      ],
      proTip: "Lengan Anda hanyalah seutas tali penghubung; seluruh daya ledak murni berasal dari kontraksi otot glutes dan pinggul."
    }
  },
  {
    id: "kb-goblet-squat",
    name: "Kettlebell Goblet Squat",
    equipment: "kettlebell",
    equipmentLabel: "Kettlebell",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan (Quads)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Core / Perut"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/H5VYU6t_w9o",
    fullVideoImageUrl: "https://img.youtube.com/vi/H5VYU6t_w9o/hqdefault.jpg",
    summary: "Latihan paha depan dan pinggul dengan posisi beban ergonomis yang menjaga postur tulang belakang tetap tegak.",
    tutorial: {
      setup: [
        "Pegang tanduk (horns) kettlebell di kedua sisi tepat di depan dada.",
        "Buka kaki selebar bahu dengan jari kaki mengarah keluar 20-30 derajat."
      ],
      movement: [
        "Tarik napas dan jongkok perlahan hingga kedua siku berada di sisi dalam paha.",
        "Tahan posisi sejajar lantai selama 1 detik tanpa membiarkan punggung membungkuk.",
        "Dorong tumit ke lantai untuk berdiri kembali dengan kuat."
      ],
      breathing: "Tarik napas saat turun, hembuskan napas saat mendorong ke posisi berdiri.",
      mistakes: [
        "Tumit terangkat dari lantai saat posisi bawah.",
        "Lutut masuk ke dalam (knee valgus)."
      ],
      proTip: "Gunakan kedua siku untuk mendorong kedua lutut ke luar di posisi paling bawah."
    }
  },

  // ==================== PLATE ====================
  {
    id: "plate-g2oh",
    name: "Plate Ground to Overhead",
    equipment: "plate",
    equipmentLabel: "Plate",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu & Seluruh Tubuh",
    secondaryMuscles: [ExerciseAttributeValueEnum.QUADRICEPS, ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.TRAPS],
    secondaryMuscleNames: ["Paha Depan", "Glutes", "Pundak Atas"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/9QqsfhED01U",
    fullVideoImageUrl: "https://img.youtube.com/vi/9QqsfhED01U/hqdefault.jpg",
    summary: "Gerakan fungsional terintegrasi yang memindahkan beban piringan besi dari lantai langsung ke atas kepala dalam satu alur mulus.",
    tutorial: {
      setup: [
        "Posisikan plate tegak di lantai di antara kedua kaki.",
        "Jongkok dengan dada tegak dan pegang sisi tepi plate pada posisi jam 9 dan jam 3."
      ],
      movement: [
        "Dorong lantai dengan kaki untuk mengangkat plate dekat di depan tubuh.",
        "Gunakan momentum dorongan pinggul untuk membalik dan mendorong plate lurus ke atas kepala.",
        "Kunci lengan di atas kepala dengan kepala sedikit maju melewati garis plate.",
        "Turunkan kembali plate ke lantai dengan kontrol yang aman."
      ],
      breathing: "Tarik napas di lantai, hembuskan napas saat mendorong beban mengunci di atas kepala.",
      mistakes: [
        "Mengangkat beban hanya mengandalkan pinggang tanpa menekuk lutut.",
        "Membiarkan beban mengayun terlalu jauh dari garis tengah tubuh."
      ],
      proTip: "Jaga jalur lintasan plate sedekat mungkin dengan dada Anda sepanjang gerakan."
    }
  },
  {
    id: "plate-steering-raise",
    name: "Steering Plate Front Raise",
    equipment: "plate",
    equipmentLabel: "Plate",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu Depan (Front Deltoid)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS, ExerciseAttributeValueEnum.TRAPS],
    secondaryMuscleNames: ["Lengan Bawah", "Trapezius"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/yHQi_GUNc5o",
    fullVideoImageUrl: "https://img.youtube.com/vi/yHQi_GUNc5o/hqdefault.jpg",
    summary: "Latihan isolasi bahu depan yang dikombinasikan dengan rotasi pergelangan tangan untuk stimulasi deltoid yang unik.",
    tutorial: {
      setup: [
        "Berdiri tegak dengan kaki selebar pinggul.",
        "Pegang weight plate di sisi kiri dan kanan (arah jam 9 dan 3) di depan paha."
      ],
      movement: [
        "Angkat plate lurus ke depan hingga setinggi bahu atau mata.",
        "Di posisi atas, putar plate seperti menyetir mobil (tangan kiri ke atas, lalu tangan kanan ke atas).",
        "Putar kembali ke posisi netral dan turunkan plate secara perlahan ke paha."
      ],
      breathing: "Hembuskan napas saat mengangkat dan memutar plate, tarik napas saat menurunkan beban.",
      mistakes: [
        "Tubuh mengayun ke belakang saat mengangkat beban.",
        "Mengangkat plate melebihi tinggi kepala."
      ],
      proTip: "Gunakan plate dengan bobot sedang (5-10 kg) untuk menjaga kendali rotasi tetap stabil tanpa mengorbankan postur."
    }
  },
  {
    id: "plate-russian-twist",
    name: "Weighted Plate Russian Twist",
    equipment: "plate",
    equipmentLabel: "Plate",
    primaryMuscle: ExerciseAttributeValueEnum.OBLIQUES,
    primaryMuscleCode: "Ob",
    primaryMuscleName: "Pinggang Samping (Obliques)",
    secondaryMuscles: [ExerciseAttributeValueEnum.ABDOMINALS, ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Perut Depan", "Grip"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/7ucQ5Clo0HQ",
    fullVideoImageUrl: "https://img.youtube.com/vi/7ucQ5Clo0HQ/hqdefault.jpg",
    summary: "Latihan rotasi core yang sangat efektif untuk mempertegas lekukan otot pinggang samping dan kekuatan stabilitas torso.",
    tutorial: {
      setup: [
        "Duduk di lantai dengan lutut ditekuk dan tumit sedikit melayang di udara.",
        "Condongkan tubuh bagian atas ke belakang sekitar 45 derajat membentuk huruf V.",
        "Pegang plate dengan kedua tangan di depan dada."
      ],
      movement: [
        "Putar torso dan bawa plate menyentuh lantai di sisi pinggul kanan.",
        "Putar kembali melalui tengah dan bawa plate menyentuh lantai di sisi pinggul kiri.",
        "Jaga posisi kaki tetap stabil dan tidak bergoyang."
      ],
      breathing: "Hembuskan napas di setiap titik rotasi sisi, tarik napas saat plate melintasi bagian tengah.",
      mistakes: [
        "Hanya menggerakkan tangan tanpa memutar bahu dan tulang rusuk (torso).",
        "Punggung bawah membungkuk kendur."
      ],
      proTip: "Ikuti pergerakan plate dengan pandangan mata Anda agar rotasi tulang rusuk terjadi secara sempurna."
    }
  }
];
