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
  researchCitation?: {
    journal: string;
    study: string;
    findings: string;
  };
  tutorial: {
    setup: string[];
    movement: string[];
    breathing: string;
    mistakes: string[];
    proTip: string;
  };
}

export const EXERCISES_DATABASE: ExerciseDetail[] = [
  // =========================================================================
  // 1. BARBELL (MURNI BARBEL BEBAS — VIDEO ULTRA-SHORT / DEMO ≤ 30 DETIK)
  // =========================================================================
  {
    id: "bb-bench-press",
    name: "Barbell Flat Bench Press",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada (Pectoralis Major)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Triceps", "Bahu Depan"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/embed/OZYybDMR2i4",
    fullVideoImageUrl: "https://img.youtube.com/vi/OZYybDMR2i4/hqdefault.jpg",
    summary: "Latihan kompaun utama untuk membangun ketebalan serat dada, triceps, dan deltoid anterior dengan stabilisasi barbel bilateral.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Schick et al. (2010) & Trebs et al. (2010)",
      findings: "Aktivasi EMG tertinggi pada Pectoralis Major (sternocostal) dan Anterior Deltoid. Barbel bebas memicu stabilisasi 3D jauh lebih tinggi dibanding Smith machine."
    },
    
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
    primaryMuscleName: "Paha Depan (Quadriceps)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Paha Belakang", "Perut (Core)"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/dW3zj79xfrc",
    fullVideoImageUrl: "https://img.youtube.com/vi/dW3zj79xfrc/hqdefault.jpg",
    summary: "Raja latihan kaki untuk melatih paha depan (quadriceps), pinggul (glutes), dan rantai kinetik seluruh tubuh.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Schoenfeld, B.J. (2010) - Squatting Kinematics & Kinetics",
      findings: "Kedalaman paha paralel/bawah mengoptimalkan rekrutmen Quadriceps (Vastus Lateralis/Medialis) dan Gluteus Maximus secara maksimal tanpa merusak sendi patellofemoral."
    },
    
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
    primaryMuscleName: "Punggung (Latissimus Dorsi)",
    secondaryMuscles: [ExerciseAttributeValueEnum.BICEPS, ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Biceps", "Pundak Atas (Traps)", "Bahu Belakang"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/phVtqawIgbk",
    fullVideoImageUrl: "https://img.youtube.com/vi/phVtqawIgbk/hqdefault.jpg",
    summary: "Latihan penebal otot punggung bebas untuk merangsang latissimus dorsi, rhomboids, dan fleksor siku tanpa bantuan rel mesin.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Fenwick, Brown, & McGill (2009)",
      findings: "Memicu aktivasi simetris tertinggi pada Latissimus Dorsi dan Erector Spinae di seluruh tulang belakang lumbal dibanding variasi row mesin."
    },
    
    tutorial: {
      setup: [
        "Berdiri dengan kaki selebar bahu, tekuk sedikit lutut dan dorong pinggul ke belakang (hinge) hingga tubuh condong 45 derajat.",
        "Pegang palang barbel selebar bahu dengan telapak tangan menghadap ke bawah (overhand grip).",
        "Jaga tulang belakang lurus netral dan kunci otot core."
      ],
      movement: [
        "Tarik barbel ke arah pusar / perut bawah dengan memimpin menggunakan dorongan siku ke belakang.",
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
    summary: "Latihan unilateral efektif menggunakan barbel untuk melatih keseimbangan, kekuatan otot paha, dan stabilitas panggul.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Ebben et al. (2009) - Unilateral Lower Body EMG",
      findings: "Reverse lunge mempertahankan beban aktivasi Quadriceps dan Gluteus setara forward lunge, namun secara signifikan memangkas gaya geser (shear force) patellofemoral pada lutut."
    },
    
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
    videoUrl: "https://www.youtube.com/shorts/uPWycTcl05U",
    fullVideoImageUrl: "https://img.youtube.com/vi/uPWycTcl05U/hqdefault.jpg",
    summary: "Latihan kekuatan total tubuh terhebat yang melatih seluruh rantai posterior tubuh dari tumit hingga leher.",
    researchCitation: {
      journal: "Medicine & Science in Sports & Exercise (MSSE)",
      study: "Escamilla et al. (2002) & Cholewa et al. (2019)",
      findings: "Rekrutmen rantai posterior maksimal: Biceps Femoris (Hamstrings), Gluteus Maximus, dan spinal erector via mekanisme hip hinge beban kompaun tinggi."
    },
    
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
  {
    id: "bb-overhead-press",
    name: "Barbell Overhead Press (OHP)",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu Depan & Samping (Deltoids)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Triceps", "Trapezius", "Core / Perut"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/afR3tPH6y_g",
    fullVideoImageUrl: "https://img.youtube.com/vi/afR3tPH6y_g/hqdefault.jpg",
    summary: "Latihan berdiri klasik untuk membangun tenaga dorong vertikal, bahu tegap, dan kekuatan stabilitas inti tubuh.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Saeterbakken & Fimland (2013)",
      findings: "Standing barbell overhead press memicu aktivasi Anterior & Lateral Deltoid serta stabilitas otot inti 25-30% lebih tinggi dibanding posisi duduk atau mesin."
    },
    
    tutorial: {
      setup: [
        "Letakkan barbel di rak setinggi dada bagian atas.",
        "Pegang barbel selebar bahu dengan telapak tangan menghadap ke depan dan siku sedikit di depan palang.",
        "Kencangkan pantat dan perut agar tubuh menjadi fondasi yang kokoh."
      ],
      movement: [
        "Dorong barbel lurus ke atas kepala dalam garis vertikal.",
        "Sedikit tarik kepala ke belakang saat barbel lewat, lalu majukan kembali kepala ke posisi netral saat barbel mengunci di atas.",
        "Turunkan barbel terkontrol kembali ke tulang selangka."
      ],
      breathing: "Tarik napas di dada bawah, hembuskan napas kuat saat mendorong barbel melewati kepala.",
      mistakes: [
        "Melengkungkan pinggang bawah ke belakang (arching) demi memaksakan beban berat.",
        "Siku jatuh terlalu ke belakang garis tubuh."
      ],
      proTip: "Kencangkan otot glutes sekencang mungkin untuk mengunci pinggul dan melindungi tulang lumbar."
    }
  },

  // =========================================================================
  // 2. DUMBBELL (MURNI DUMBEL BEBAS — VIDEO ULTRA-SHORT / DEMO ≤ 30 DETIK)
  // =========================================================================
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
    researchCitation: {
      journal: "Journal of Sports Sciences",
      study: "Farias et al. (2017)",
      findings: "Beban unilateral bebas memperluas Range of Motion (ROM) dan adduksi horizontal, menghasilkan kontraksi puncak Pectoralis Major setara atau melampaui barbel pada posisi deep stretch."
    },
    
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
    researchCitation: {
      journal: "Int. J. Environ. Res. Public Health",
      study: "Rodríguez-Ridao et al. (2020)",
      findings: "Sudut inklinasi bench 30 derajat terbukti secara biomekanik mengoptimalkan aktivasi Clavicular Head (dada atas) tanpa dominasi berlebih dari deltoid depan."
    },
    
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
    summary: "Latihan ramah sendi bahu yang melatih stabilitas dada, triceps, serta otot rotasi core (anti-rotation) di lantai.",
    researchCitation: {
      journal: "Strength & Conditioning Journal",
      study: "Schoenfeld, B.J. (2016)",
      findings: "Pembatasan ekstensi bahu oleh lantai mengeliminasi stres anterior kapsul bahu sembari memaksimalkan aktivasi serat sternal dada dan penguncian Triceps Brachii."
    },
    
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
    id: "db-single-row",
    name: "Single-Arm Dumbbell Bent-Over Row",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.BACK,
    primaryMuscleCode: "B",
    primaryMuscleName: "Punggung (Lats & Rhomboids)",
    secondaryMuscles: [ExerciseAttributeValueEnum.BICEPS, ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Biceps", "Lengan Bawah"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/k-Va22pXflE",
    fullVideoImageUrl: "https://img.youtube.com/vi/k-Va22pXflE/hqdefault.jpg",
    summary: "Latihan punggung unilateral dengan dumbel bebas untuk membangun ketebalan lats dan mengoreksi asimetri kekuatan.",
    researchCitation: {
      journal: "Sports Medicine",
      study: "Saeterbakken et al. (2015)",
      findings: "Tumpuan unilateral tangan pada bench meminimalkan tekanan kompresi lumbal tulang belakang sembari mengisolasi Latissimus Dorsi dan Rhomboid secara seimbang."
    },
    
    tutorial: {
      setup: [
        "Tumpukan satu lutut dan satu tangan di bench, tubuh horizontal rata dengan lantai.",
        "Pegang dumbel di tangan yang bebas dengan lengan menggantung lurus ke bawah.",
        "Punggung lurus kokoh dan pandangan rileks ke lantai."
      ],
      movement: [
        "Tarik dumbel ke arah pinggul dengan menggerakkan siku ke atas dan ke belakang.",
        "Remas otot lats di bagian atas selama 1 detik penuh.",
        "Turunkan dumbel secara perlahan hingga merasakan regangan penuh pada otot punggung."
      ],
      breathing: "Hembuskan napas saat menarik dumbel, tarik napas saat menurunkan beban.",
      mistakes: [
        "Memutar torso/bahu secara berlebihan saat menarik dumbel.",
        "Menarik beban menggunakan tangan bukan mengarahkan siku."
      ],
      proTip: "Pikirkan tangan Anda hanya sebagai pengait; tarik beban menggunakan otot punggung samping (lats)."
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
    videoUrl: "https://www.youtube.com/shorts/b0pZWf3vfRk",
    fullVideoImageUrl: "https://img.youtube.com/vi/b0pZWf3vfRk/hqdefault.jpg",
    summary: "Latihan isolasi klasik untuk membangun ukuran dan puncak (peak) otot bisep dengan gerakan supinasi penuh.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Oliveira et al. (2009)",
      findings: "Gerakan supinasi pergelangan tangan pada fase angkat meningkatkan amplitudo EMG Biceps Brachii (caput longum & breve) hingga 18% dibanding pegangan netral statis."
    },
    
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
    videoUrl: "https://www.youtube.com/shorts/MKWBV29S6c0",
    fullVideoImageUrl: "https://img.youtube.com/vi/MKWBV29S6c0/hqdefault.jpg",
    summary: "Kunci utama menciptakan ilusi bahu lebar dan postur V-Taper yang proporsional menggunakan sepasang dumbel.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Campos et al. (2020)",
      findings: "Elevasi tangan pada bidang skapula (scaption ~30 derajat ke depan) menghasilkan aktivasi puncak Lateral Deltoid tanpa risiko penyempitan ruang subakromial (impingement)."
    },
    
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
    videoUrl: "https://www.youtube.com/shorts/8VrXHfHH5PM",
    fullVideoImageUrl: "https://img.youtube.com/vi/8VrXHfHH5PM/hqdefault.jpg",
    summary: "Variasi squat dengan dumbel vertikal di dada yang melatih kedalaman squat dengan postur dada yang tegak sempurna.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Collins et al. (2021)",
      findings: "Penempatan dumbel di depan dada memaksa torso tegak lurus, memangkas beban torsi lumbal hingga 40% sambil mempertahankan aktivasi penuh Quadriceps (Vastus Medialis)."
    },
    
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

  // =========================================================================
  // 3. BODYWEIGHT (MURNI BERAT TUBUH — VIDEO ULTRA-SHORT / DEMO ≤ 30 DETIK)
  // =========================================================================
  {
    id: "bw-pushup",
    name: "Standard Push-Up",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada (Pectoralis Major)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Triceps", "Bahu Depan", "Perut (Core)"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/ba8tr1NzwXU",
    fullVideoImageUrl: "https://img.youtube.com/vi/ba8tr1NzwXU/hqdefault.jpg",
    summary: "Fondasi calisthenics terbaik untuk membangun kekuatan dorong dada, lengan, dan stabilitas inti tubuh murni dengan berat badan.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Gottschall et al. (2018) & Suprak et al. (2011)",
      findings: "Push-up standar menopang ~64-69% bobot tubuh dengan ko-aktivasi tinggi antara Pectoralis Major, Triceps Brachii, dan Serratus Anterior."
    },
    
    tutorial: {
      setup: [
        "Posisikan tangan di lantai sedikit lebih lebar dari bahu dengan jari menghadap ke depan.",
        "Kencangkan perut dan pantat, tubuh lurus sempurna seperti papan dari kepala hingga tumit."
      ],
      movement: [
        "Turunkan dada hingga berjarak 2-3 cm dari lantai.",
        "Siku membentuk sudut 45 derajat (panah) dari tubuh, bukan berbentuk T.",
        "Dorong lantai menjauh hingga lengan lurus kembali tanpa mengunci sendi secara kasar."
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
    summary: "Variasi push-up lantai intensif yang memaksimalkan isolasi beban tubuh pada ketiga kepala otot triceps dan dada bagian dalam.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Cogley et al. (2005)",
      findings: "Posisi tangan sempit berbentuk segitiga menghasilkan aktivasi EMG tertinggi yang signifikan secara statistik pada Triceps Brachii dan dada tengah dibanding push-up biasa."
    },
    
    tutorial: {
      setup: [
        "Ambil posisi plank tinggi di lantai dengan kedua telapak tangan didekatkan tepat di bawah dada.",
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
    id: "bw-pike-pushup",
    name: "Pike Push-Up",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu & Deltoid (Overhead Press Calisthenics)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Triceps", "Pundak Atas", "Core"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/embed/WVYkIlM2M9g",
    fullVideoImageUrl: "https://img.youtube.com/vi/WVYkIlM2M9g/hqdefault.jpg",
    summary: "Latihan calisthenics murni pengganti mesin kabel untuk melatih kekuatan bahu vertikal dan deltoid anterior di atas lantai.",
    researchCitation: {
      journal: "European Journal of Applied Physiology",
      study: "Calatayud et al. (2015) & Ebben et al. (2011)",
      findings: "Sudut panggul inverted-V menggeser vektor gaya gravitasi ke bahu (Anterior Deltoid dan Upper Trapezius), menjadi padanan biomekanik alami untuk overhead press."
    },
    
    tutorial: {
      setup: [
        "Mulai dari posisi push-up standar di lantai.",
        "Langkahkan kaki mendekat ke arah tangan sambil mendorong pinggul ke atas hingga tubuh membentuk huruf V terbalik (pike).",
        "Jaga punggung dan lengan tetap lurus, pandangan rileks ke arah jemari kaki."
      ],
      movement: [
        "Tekuk siku dan turunkan kepala maju secara diagonal ke depan kedua tangan (membentuk tripod).",
        "Sentuhkan ubun-ubun kepala secara lembut ke matras.",
        "Dorong lantai menjauh hingga kembali ke posisi V terbalik penuh."
      ],
      breathing: "Tarik napas saat kepala turun ke lantai, hembuskan napas kuat saat mendorong tubuh kembali ke atas.",
      mistakes: [
        "Menurunkan kepala tepat di antara kedua tangan (siku melebar berisiko jepit bahu). Selalu arahkan kepala sedikit maju diagonal.",
        "Punggung membungkuk kendur."
      ],
      proTip: "Semakin dekat posisi kaki ke tangan, semakin besar persentase berat tubuh yang berpindah ke otot bahu Anda."
    }
  },
  {
    id: "bw-air-squat",
    name: "Bodyweight Air Squat",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan (Quadriceps)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.CALVES],
    secondaryMuscleNames: ["Pantat (Glutes)", "Paha Belakang", "Betis"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/8voSXZyTp2A",
    fullVideoImageUrl: "https://img.youtube.com/vi/8voSXZyTp2A/hqdefault.jpg",
    summary: "Gerakan fundamental calisthenics tanpa alat untuk membangun daya tahan otot paha depan, fleksibilitas panggul, dan mobilitas sendi.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Caterisano et al. (2002)",
      findings: "Kedalaman squat di bawah 90 derajat secara eksponensial meningkatkan rekrutmen Gluteus Maximus dan koordinasi ekstensor lutut (Quadriceps)."
    },
    
    tutorial: {
      setup: [
        "Berdiri tegak dengan kaki dibuka selebar bahu dan jari kaki mengarah sedikit ke luar.",
        "Bentangkan kedua tangan lurus ke depan setinggi dada untuk menjaga keseimbangan postur."
      ],
      movement: [
        "Tarik napas dan turunkan pinggul ke bawah dan ke belakang seolah hendak duduk di kursi rendah.",
        "Turun hingga lipatan pinggul sejajar atau sedikit di bawah lutut, jaga dada tetap tegak.",
        "Dorong lantai melalui seluruh permukaan telapak kaki untuk kembali berdiri tegak."
      ],
      breathing: "Tarik napas saat turun, hembuskan napas kuat saat mendorong tubuh kembali berdiri.",
      mistakes: [
        "Lutut masuk ke dalam (valgus) saat turun.",
        "Tumit terangkat dari lantai saat posisi bawah."
      ],
      proTip: "Pastikan lutut selalu mengikuti arah garis jari kaki Anda sepanjang gerakan."
    }
  },
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
    summary: "Latihan calisthenics lantai fantastis untuk menguatkan seluruh otot rantai posterior (erector spinae, glutes, hamstrings) tanpa alat tambahan.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Oliver et al. (2010)",
      findings: "Ekstensi prone di lantai menghasilkan 55-65% MVIC aktivasi Erector Spinae (tulang punggung bawah) dan Multifidus dengan gaya kompresi tulang belakang yang sangat minim."
    },
    
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
    videoUrl: "https://www.youtube.com/shorts/ZPG8OsHKXLw",
    fullVideoImageUrl: "https://img.youtube.com/vi/ZPG8OsHKXLw/hqdefault.jpg",
    summary: "Raja latihan tarik calisthenics untuk melebarkan sayap punggung dan melatih kekuatan cengkeraman tangan pada palang pull-up.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Youdas et al. (2010)",
      findings: "Pegangan pronasi lebar (overhand) memaksimalkan rekrutmen Latissimus Dorsi dan Lower Trapezius dibanding chin-up yang lebih condong ke bicep."
    },
    
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
    summary: "Latihan core gantung calisthenics yang sangat efektif mengisolasi otot perut bawah dan fleksor panggul tanpa membebani leher.",
    researchCitation: {
      journal: "Physical Therapy Journal",
      study: "Escamilla et al. (2006)",
      findings: "Menggantung di palang dengan fleksi lutut/panggul memicu aktivasi EMG tertinggi pada Rectus Abdominis bawah dan Obliques eksternal dibandingkan crunch lantai."
    },
    
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
    id: "bw-plank",
    name: "Full Body Isometric Plank",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.ABDOMINALS,
    primaryMuscleCode: "Ab",
    primaryMuscleName: "Otot Inti (Transverse Abdominis)",
    secondaryMuscles: [ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.GLUTES],
    secondaryMuscleNames: ["Bahu", "Pantat"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/nVIeqNLGLa0",
    fullVideoImageUrl: "https://img.youtube.com/vi/nVIeqNLGLa0/hqdefault.jpg",
    summary: "Latihan isometrik murni lantai untuk menciptakan dinding perut yang kokoh dan melindungi tulang belakang dari cedera.",
    researchCitation: {
      journal: "Sports Biomechanics",
      study: "Schoenfeld et al. (2014) & Snarr & Esco (2014)",
      findings: "Kontraksi isometrik mengaktifkan Transverse Abdominis dan Rectus Abdominis secara stabil tanpa menimbulkan stres fleksi berulang pada diskus lumbal."
    },
    
    tutorial: {
      setup: [
        "Bertumpu pada kedua lengan bawah (forearm) di lantai dengan siku tepat di bawah bahu.",
        "Rapatkan kedua kaki dan bertumpu pada ujung jari kaki.",
        "Kencangkan seluruh otot dari leher hingga pergelangan kaki."
      ],
      movement: [
        "Tahan tubuh dalam satu garis lurus horizontal sempurna.",
        "Dorong lantai menjauh melalui siku untuk menjaga tulang belikat tetap stabil dan rata (tidak tenggelam).",
        "Bernapaslah secara teratur dan stabil tanpa menahan napas."
      ],
      breathing: "Napas dangkal dan terkendali dari diafragma, jangan pernah menahan napas saat menahan plank.",
      mistakes: [
        "Pinggul melorot ke bawah (menyebabkan sakit punggung bawah).",
        "Pantat terangkat terlalu tinggi menyerupai gunung."
      ],
      proTip: "Bayangkan Anda sedang menarik siku ke arah jari kaki untuk mengaktifkan kontraksi otot perut 2x lipat lebih keras."
    }
  },

  // =========================================================================
  // 4. KETTLEBELL (MURNI KETTLEBELL — VIDEO ULTRA-SHORT / DEMO ≤ 30 DETIK)
  // =========================================================================
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
    videoUrl: "https://www.youtube.com/shorts/2gXtvqLa_T8",
    fullVideoImageUrl: "https://img.youtube.com/vi/2gXtvqLa_T8/hqdefault.jpg",
    summary: "Latihan daya ledak pinggul (hip hinge) yang membakar kalori tinggi sekaligus memperkuat postur rantai posterior tubuh murni dengan kettlebell.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "McGill & Marshall (2012) & Lake & Lauder (2012)",
      findings: "Pola pulse-relaxation menghasilkan aktivasi hingga 76% MVIC Gluteus Maximus dan 80% Hamstrings, membangun daya ledak posterior chain tanpa kompresi spinal statis."
    },
    
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
    primaryMuscleName: "Paha Depan (Quadriceps)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat (Glutes)", "Core / Perut"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/EKhUewdihYA",
    fullVideoImageUrl: "https://img.youtube.com/vi/EKhUewdihYA/hqdefault.jpg",
    summary: "Latihan paha depan dan pinggul dengan posisi beban kettlebell ergonomis yang menjaga postur tulang belakang tetap tegak.",
    researchCitation: {
      journal: "Journal of Applied Biomechanics",
      study: "Beardsley & Contreras (2014)",
      findings: "Pegangan tanduk kettlebell menuntut stabilitas skapula dan dinding dada atas sembari memberikan torsi langsung ke Quadriceps."
    },
    
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
  {
    id: "kb-clean-press",
    name: "Kettlebell Clean and Press",
    equipment: "kettlebell",
    equipmentLabel: "Kettlebell",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu & Tenaga Balistik",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRICEPS, ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.BACK],
    secondaryMuscleNames: ["Triceps", "Pantat", "Punggung"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/W_bY5pbq0MI",
    fullVideoImageUrl: "https://img.youtube.com/vi/W_bY5pbq0MI/hqdefault.jpg",
    summary: "Gerakan dinamis kettlebell yang memadukan tarikan dari lantai ke posisi rack dada, lalu didorong lurus ke atas kepala.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Manocchia et al. (2013)",
      findings: "Gerakan multi-sendi terintegrasi memicu triple extension (ankle, knee, hip) yang diteruskan secara balistik ke dorongan vertikal bahu (Deltoids)."
    },
    
    tutorial: {
      setup: [
        "Letakkan kettlebell di antara kedua kaki, ambil posisi hip hinge.",
        "Pegang handle dengan satu tangan, lengan lurus santai."
      ],
      movement: [
        "Tarik kettlebell ke atas dengan dorongan pinggul, putar pergelangan tangan dengan halus agar kettlebell mendarat lembut di lekukan siku dada (rack position).",
        "Dari posisi rack, dorong kettlebell lurus ke atas kepala hingga lengan mengunci stabil.",
        "Turunkan kembali ke rack, lalu ayunkan kembali ke lantai."
      ],
      breathing: "Tarik napas saat mengayun, hembuskan napas saat mendarat di rack, dan hembuskan napas kuat saat mendorong ke atas.",
      mistakes: [
        "Membiarkan kettlebell menghantam pergelangan tangan dengan keras di posisi rack.",
        "Melengkungkan pinggang ke samping saat mendorong beban overhead."
      ],
      proTip: "Pertahankan siku tetap dekat dengan tulang rusuk saat transisi clean agar bola kettlebell berputar mulus tanpa benturan."
    }
  },
  {
    id: "kb-single-row",
    name: "Single-Arm Kettlebell Row",
    equipment: "kettlebell",
    equipmentLabel: "Kettlebell",
    primaryMuscle: ExerciseAttributeValueEnum.BACK,
    primaryMuscleCode: "B",
    primaryMuscleName: "Punggung (Latissimus Dorsi)",
    secondaryMuscles: [ExerciseAttributeValueEnum.BICEPS, ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Biceps", "Grip / Lengan Bawah"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/4KqpZX_awC4",
    fullVideoImageUrl: "https://img.youtube.com/vi/4KqpZX_awC4/hqdefault.jpg",
    summary: "Latihan menarik unilateral dengan pegangan tebal kettlebell yang melatih ketebalan lats dan daya cengkeram telapak tangan.",
    researchCitation: {
      journal: "Canadian Journal of Applied Physiology",
      study: "Behm et al. (2005)",
      findings: "Tahanan unilateral dengan handle kettlebell meningkatkan aktivitas motor unit otot punggung (Lats) serta melatih kekuatan genggaman (grip strength)."
    },
    
    tutorial: {
      setup: [
        "Ambil posisi lunge terhuyung (staggered stance) dengan kaki kiri di depan dan kettlebell di sisi kanan.",
        "Topang siku kiri di atas lutut paha kiri, jaga punggung lurus mendatar 45 derajat."
      ],
      movement: [
        "Raih handle kettlebell dengan tangan kanan dan tarik siku kanan lurus ke atas dan ke belakang panggul.",
        "Remas otot punggung di puncak kontraksi.",
        "Turunkan kettlebell secara perlahan hingga merasakan regangan penuh pada otot lats."
      ],
      breathing: "Hembuskan napas saat menarik kettlebell, tarik napas saat menurunkan beban.",
      mistakes: [
        "Memutar badan ke kanan untuk membantu tarikan.",
        "Punggung melengkung bundar."
      ],
      proTip: "Tarik handle ke arah pinggul bukan ke arah dada agar serat otot latissimus terisolasi optimal."
    }
  },

  // =========================================================================
  // 5. PLATE (MURNI PIRINGAN BESI — VIDEO ULTRA-SHORT / DEMO ≤ 30 DETIK)
  // =========================================================================
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
    videoUrl: "https://www.youtube.com/shorts/HHKv4YSXD2A",
    fullVideoImageUrl: "https://img.youtube.com/vi/HHKv4YSXD2A/hqdefault.jpg",
    summary: "Gerakan fungsional terintegrasi yang memindahkan beban piringan besi dari lantai langsung ke atas kepala dalam satu alur mulus.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Schoenfeld, B.J. (2020)",
      findings: "Gerakan compound ground-to-overhead melibatkan transfer momentum dari panggul ke deltoid anterior dan trapezius secara fungsional."
    },
    
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
    videoUrl: "https://www.youtube.com/shorts/1A0V_wpcjN8",
    fullVideoImageUrl: "https://img.youtube.com/vi/1A0V_wpcjN8/hqdefault.jpg",
    summary: "Latihan isolasi bahu depan yang dikombinasikan dengan rotasi pergelangan tangan pada piringan besi untuk stimulasi deltoid yang unik.",
    researchCitation: {
      journal: "Biology of Sport",
      study: "Coratella et al. (2020)",
      findings: "Rotasi dinamis pergelangan tangan saat elevasi horizontal mengaktifkan kombinasi unik Anterior Deltoid, Lateral Deltoid, dan Serratus Anterior."
    },
    
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
    videoUrl: "https://www.youtube.com/shorts/hL10_LcXyCM",
    fullVideoImageUrl: "https://img.youtube.com/vi/hL10_LcXyCM/hqdefault.jpg",
    summary: "Latihan rotasi core yang sangat efektif untuk mempertegas lekukan otot pinggang samping dan kekuatan stabilitas torso menggunakan plate.",
    researchCitation: {
      journal: "Journal of Electromyography and Kinesiology (JEK)",
      study: "McGill et al. (2010)",
      findings: "Rotasi torso terkontrol dengan beban plate menantang otot Obliques internal/eksternal dalam menciptakan stabilitas torsi batang tubuh."
    },
    
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
  },
  {
    id: "plate-overhead-squat",
    name: "Plate Overhead Squat",
    equipment: "plate",
    equipmentLabel: "Plate",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan & Stabilitas Bahu",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Pantat", "Bahu", "Core"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/N_olWJJm1Zo",
    fullVideoImageUrl: "https://img.youtube.com/vi/N_olWJJm1Zo/hqdefault.jpg",
    summary: "Squat dengan menahan plate lurus di atas kepala untuk menguji fleksibilitas panggul, kekuatan paha, dan stabilitas scapula.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Aspe & Swinton (2014)",
      findings: "Menahan beban plate overhead menuntut aktivasi simultan Upper Trapezius, Deltoids, dan otot inti, sembari melatih ekstensi paha (Quadriceps) dalam postur toraks terbuka."
    },
    
    tutorial: {
      setup: [
        "Berdiri dengan kaki selebar bahu.",
        "Dorong plate lurus ke atas kepala dengan kedua tangan memegang tepi plate, lengan lurus mengunci."
      ],
      movement: [
        "Turunkan pinggul ke bawah hingga posisi squat penuh sambil menjaga plate tetap stabil tepat di atas garis tengah tumit.",
        "Jaga dada tetap tegak dan pandangan lurus ke depan.",
        "Dorong lantai melalui tumit untuk kembali berdiri tegak."
      ],
      breathing: "Tarik napas saat turun, hembuskan napas kuat saat mendorong naik.",
      mistakes: [
        "Plate jatuh condong ke depan saat jongkok (kurang mobilitas sendi bahu).",
        "Punggung membungkuk."
      ],
      proTip: "Aktifkan otot trapezius dan dorong plate ke arah langit-langit sepanjang gerakan untuk menjaga stabilitas."
    }
  },

  {
    id: "bb-incline-press",
    name: "Barbell Incline Bench Press",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.CHEST,
    primaryMuscleCode: "C",
    primaryMuscleName: "Dada Atas (Clavicular Pectoralis)",
    secondaryMuscles: [ExerciseAttributeValueEnum.SHOULDERS, ExerciseAttributeValueEnum.TRICEPS],
    secondaryMuscleNames: ["Bahu Depan","Triceps"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/8iPEnn-ltC8",
    fullVideoImageUrl: "https://img.youtube.com/vi/8iPEnn-ltC8/hqdefault.jpg",
    summary: "Bench press pada sudut kemiringan 30 derajat untuk mengisolasi ketebalan serat clavicular dada atas.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Trebs et al. (2010)",
      findings: "Sudut inklinasi 30-45 derajat meningkatkan aktivasi EMG clavicular head dada atas secara signifikan dibanding flat bench."
    },
    tutorial: {
      setup: [
        "Atur bangku miring ke sudut 30-45 derajat.",
        "Rapatkan belikat ke bangku dan letakkan tangan selebar 1.5x lebar bahu di palang barbel."
],
      movement: [
        "Turunkan barbel terkontrol ke bagian atas dada tepat di bawah tulang selangka.",
        "Dorong barbel kembali ke atas dengan mengontraksikan dada atas secara eksplosif."
],
      breathing: "Tarik napas saat menurunkan barbel, hembuskan napas kuat saat mendorong ke atas.",
      mistakes: [
        "Sudut bangku terlalu tegak (>45 derajat) yang menggeser beban sepenuhnya ke bahu depan.",
        "Pantat terangkat dari bangku."
],
      proTip: "Fokuskan pada meremas kedua lengan atas ke arah tengah dada saat mendorong ke atas."
    }
  },
  {
    id: "bb-romanian-deadlift",
    name: "Barbell Romanian Deadlift (RDL)",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.HAMSTRINGS,
    primaryMuscleCode: "H",
    primaryMuscleName: "Paha Belakang & Pinggul (Hamstrings & Glutes)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.BACK],
    secondaryMuscleNames: ["Pantat (Glutes)","Erector Spinae"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/7bZ0p_i1dCc",
    fullVideoImageUrl: "https://img.youtube.com/vi/7bZ0p_i1dCc/hqdefault.jpg",
    summary: "Gerakan hip hinge murni untuk melatih peregangan eksentrik maksimal pada hamstring dan pembentukan otot bokong.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "McAllister et al. (2014)",
      findings: "RDL menghasilkan aktivasi EMG eksentrik tertinggi pada biceps femoris dan semitendinosus dengan beban mekanik konstan."
    },
    tutorial: {
      setup: [
        "Berdiri tegak memegang barbel di depan paha, kaki dibuka selebar pinggul.",
        "Tekuk lutut sedikit (15 derajat) dan pertahankan sudut tekukan lutut ini tetap statis."
],
      movement: [
        "Dorong pinggul jauh ke belakang sambil menurunkan barbel rapat menyusuri tulang kering.",
        "Turun hingga hamstring terasa terenggang maksimal (sekitar tulang kering tengah).",
        "Dorong pinggul kembali ke depan untuk berdiri tegak sambil meremas glutes."
],
      breathing: "Tarik napas saat menurunkan barbel, hembuskan napas saat mendorong pinggul ke depan.",
      mistakes: [
        "Menekuk lutut terlalu banyak hingga menjadi gerakan squat.",
        "Punggung bawah melengkung bundar saat posisi bawah."
],
      proTip: "Bayangkan Anda sedang menutup pintu mobil di belakang Anda menggunakan pantat."
    }
  },
  {
    id: "bb-barbell-curl",
    name: "Standing Barbell Bicep Curl",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.BICEPS,
    primaryMuscleCode: "Bi",
    primaryMuscleName: "Lengan Depan (Biceps Brachii)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Lengan Bawah"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/QZEqB6wUPxQ",
    fullVideoImageUrl: "https://img.youtube.com/vi/QZEqB6wUPxQ/hqdefault.jpg",
    summary: "Latihan pembebanan terberat untuk membangun massa dan ketebalan lengan depan secara komprehensif.",
    researchCitation: {
      journal: "Journal of Sports Science & Medicine (JSSM)",
      study: "Marcolin et al. (2018)",
      findings: "Barbell curl bilateral memungkinkan aktivasi massa motor unit biceps brachii tertinggi berkat pembebanan absolut yang lebih tinggi."
    },
    tutorial: {
      setup: [
        "Berdiri tegak memegang barbel selebar bahu dengan telapak tangan menghadap ke atas.",
        "Kunci siku di samping pinggang dan kencangkan perut."
],
      movement: [
        "Tekuk siku dan angkat barbel dalam busur setengah lingkaran ke arah dada atas.",
        "Tahan kontraksi puncak bicep selama 1 detik.",
        "Turunkan barbel secara perlahan dan terkontrol kembali ke posisi awal."
],
      breathing: "Hembuskan napas saat mengangkat beban, tarik napas saat menurunkan barbel.",
      mistakes: [
        "Mengayunkan pinggul atau punggung belakang untuk membantu dorongan (cheating curl).",
        "Siku bergeser maju ke depan."
],
      proTip: "Tempelkan siku Anda seolah terpatri di samping tulang rusuk untuk isolasi serat bicep 100%."
    }
  },
  {
    id: "bb-skull-crusher",
    name: "Barbell Lying Triceps Extension (Skull Crusher)",
    equipment: "barbell",
    equipmentLabel: "Barbell",
    primaryMuscle: ExerciseAttributeValueEnum.TRICEPS,
    primaryMuscleCode: "T",
    primaryMuscleName: "Lengan Belakang (Triceps Long Head)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Stabilisator Pergelangan"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/d_KZxkH_toI",
    fullVideoImageUrl: "https://img.youtube.com/vi/d_KZxkH_toI/hqdefault.jpg",
    summary: "Latihan isolasi kepala panjang triceps pada posisi peregangan penuh di atas bangku datar.",
    researchCitation: {
      journal: "Journal of Applied Biomechanics",
      study: "Boeckh-Behrens & Buskies (2000)",
      findings: "Posisi lengan overhead pada lying triceps extension memaksimalkan ketegangan mekanis pada caput longum triceps brachii."
    },
    tutorial: {
      setup: [
        "Berbaring telentang di bangku datar memegang barbel dengan kedua tangan selebar bahu di atas dada.",
        "Arahkan siku sedikit ke belakang kepala (sudut 75-80 derajat) untuk menjaga ketegangan konstan."
],
      movement: [
        "Tekuk siku perlahan dan turunkan barbel ke arah dahi atau tepat di belakang puncak kepala.",
        "Pertahankan posisi lengan atas tetap kokoh tidak bergerak.",
        "Dorong barbel kembali ke atas dengan meluruskan siku menggunakan kekuatan triceps."
],
      breathing: "Tarik napas saat menurunkan barbel, hembuskan napas kuat saat meluruskan siku.",
      mistakes: [
        "Siku melebar keluar ke samping (risiko tekanan pada sendi siku).",
        "Menggerakkan seluruh lengan atas maju-mundur."
],
      proTip: "Arahkan barbel sedikit ke belakang kepala (bukan tepat di dahi) untuk mempertahankan ketegangan puncak di posisi atas."
    }
  },
  {
    id: "db-bulgarian-squat",
    name: "Dumbbell Bulgarian Split Squat",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.QUADRICEPS,
    primaryMuscleCode: "Q",
    primaryMuscleName: "Paha Depan & Glutes (Unilateral Quads)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.HAMSTRINGS],
    secondaryMuscleNames: ["Pantat (Glutes)","Paha Belakang"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/2C-uNgKwPLE",
    fullVideoImageUrl: "https://img.youtube.com/vi/2C-uNgKwPLE/hqdefault.jpg",
    summary: "Latihan kaki unilateral intensif untuk mengoreksi ketimpangan kekuatan kaki dan membangun hipertrofi glutes dan quads.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "DeForest et al. (2014)",
      findings: "Bulgarian split squat menghasilkan aktivasi gluteus medius dan hamstring lebih tinggi dengan beban lumbar spine yang jauh lebih rendah daripada back squat."
    },
    tutorial: {
      setup: [
        "Pegang sepasang dumbel di samping tubuh, letakkan punggung satu kaki di atas bangku di belakang Anda.",
        "Langkahkan kaki depan sekitar 60-90 cm ke depan."
],
      movement: [
        "Turunkan pinggul vertikal ke bawah hingga lutut kaki belakang hampir menyentuh lantai.",
        "Jaga lutut kaki depan sejajar dengan pergelangan kaki dan dada tetap condong sedikit ke depan.",
        "Dorong melalui seluruh telapak kaki depan untuk kembali naik."
],
      breathing: "Tarik napas saat turun, hembuskan napas kuat saat mendorong tubuh naik.",
      mistakes: [
        "Posisi kaki depan terlalu dekat dengan bangku sehingga tumit depan terangkat.",
        "Lutut depan goyah ke dalam (valgus)."
],
      proTip: "Condongkan tubuh sedikit 10 derajat ke depan untuk mengalihkan beban lebih besar ke otot glutes."
    }
  },
  {
    id: "db-hammer-curl",
    name: "Dumbbell Hammer Curl",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.BICEPS,
    primaryMuscleCode: "Bi",
    primaryMuscleName: "Biceps & Lengan Bawah (Brachioradialis)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Brachialis","Forearms"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/zC3nLlEvin4",
    fullVideoImageUrl: "https://img.youtube.com/vi/zC3nLlEvin4/hqdefault.jpg",
    summary: "Curl pegangan netral untuk menebalkan otot brachialis dan otot lengan bawah (brachioradialis).",
    researchCitation: {
      journal: "Journal of Electromyography and Kinesiology",
      study: "Kleiber et al. (2015)",
      findings: "Grip netral (telapak tangan saling berhadapan) memaksimalkan rekrutmen otot brachioradialis dan brachialis yang mendorong bicep tampak lebih tinggi."
    },
    tutorial: {
      setup: [
        "Berdiri tegak memegang dumbel di samping tubuh dengan telapak tangan saling berhadapan (netral).",
        "Rapatkan siku di samping pinggang."
],
      movement: [
        "Angkat dumbel ke atas dengan mempertahankan telapak tangan tetap saling berhadapan.",
        "Remas otot di posisi puncak selama 1 detik.",
        "Turunkan beban dengan tempo 2 detik terkontrol."
],
      breathing: "Hembuskan napas saat mengangkat dumbel, tarik napas saat menurunkan.",
      mistakes: [
        "Memutar pergelangan tangan ke atas (supinasi).",
        "Mengayunkan badan ke belakang."
],
      proTip: "Kunci pergelangan tangan tetap lurus kokoh seolah sedang memegang palu."
    }
  },
  {
    id: "db-rear-delt-fly",
    name: "Dumbbell Bent-Over Rear Delt Fly",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu Belakang (Posterior Deltoid)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.BACK],
    secondaryMuscleNames: ["Rhomboids","Traps Tengah"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/q_0E7eZ_fU8",
    fullVideoImageUrl: "https://img.youtube.com/vi/q_0E7eZ_fU8/hqdefault.jpg",
    summary: "Latihan isolasi bahu belakang penting untuk keseimbangan sendi bahu dan postur tubuh tegap.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Campos et al. (2020)",
      findings: "Bent-over rear delt fly dengan lengan sedikit fleksi menghasilkan aktivasi puncak posterior deltoid tertinggi dibanding variasi berdiri."
    },
    tutorial: {
      setup: [
        "Bungkukkan badan ke depan sekitar 45-60 derajat dengan punggung lurus dan lutut sedikit ditekuk.",
        "Pegang sepasang dumbel ringan tepat menggantung di bawah dada."
],
      movement: [
        "Angkat kedua dumbel melebar ke samping dengan siku sedikit ditekuk (bentuk setengah lingkaran).",
        "Fokuskan pada menarik siku ke atas dan meremas otot bahu belakang.",
        "Turunkan dumbel secara perlahan dan terkontrol."
],
      breathing: "Hembuskan napas saat mengangkat beban ke samping, tarik napas saat menurunkan.",
      mistakes: [
        "Menggunakan beban terlalu berat sehingga mengayunkan punggung.",
        "Meremas belikat terlalu awal (mengalihkan beban ke rhomboids daripada bahu belakang)."
],
      proTip: "Bayangkan Anda sedang merentangkan sayap dan mengarahkan siku ke langit-langit."
    }
  },
  {
    id: "bw-dips",
    name: "Parallel Bar Dips",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.TRICEPS,
    primaryMuscleCode: "T",
    primaryMuscleName: "Lengan Belakang & Dada Bawah (Triceps & Lower Chest)",
    secondaryMuscles: [ExerciseAttributeValueEnum.CHEST, ExerciseAttributeValueEnum.SHOULDERS],
    secondaryMuscleNames: ["Dada Bawah","Bahu Depan"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/2z8JmcrW-As",
    fullVideoImageUrl: "https://img.youtube.com/vi/2z8JmcrW-As/hqdefault.jpg",
    summary: "Latihan dorong calisthenics berat terbaik untuk membangun kekuatan dorong triceps dan serat bawah dada.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Calatayud et al. (2017)",
      findings: "Dips menghasilkan aktivasi EMG triceps brachii dan pectoralis major bawah yang sangat tinggi setara dengan decline barbell bench press."
    },
    tutorial: {
      setup: [
        "Pegang kedua palang sejajar (parallel bars) dan dorong tubuh ke atas hingga lengan lurus.",
        "Silangkan kedua kaki dan kunci otot perut."
],
      movement: [
        "Turunkan tubuh perlahan dengan menekuk siku hingga lengan membentuk sudut 90 derajat.",
        "Jaga tubuh tetap condong sedikit ke depan untuk dada, atau tegak lurus untuk triceps.",
        "Dorong palang ke bawah untuk mengangkat kembali tubuh ke posisi atas."
],
      breathing: "Tarik napas saat menurunkan tubuh, hembuskan napas kuat saat mendorong naik.",
      mistakes: [
        "Turun terlalu dalam melebihi 90 derajat (berisiko cedera ligamen anterior bahu).",
        "Mengangkat bahu ke arah telinga (shrugging)."
],
      proTip: "Pertahankan bahu ditarik ke bawah dan ke belakang (depressed) sepanjang repetisi."
    }
  },
  {
    id: "bw-glute-bridge",
    name: "Bodyweight Glute Bridge",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.GLUTES,
    primaryMuscleCode: "G",
    primaryMuscleName: "Pantat / Pinggul (Gluteus Maximus)",
    secondaryMuscles: [ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Paha Belakang","Core"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/fkywZ6O6p6k",
    fullVideoImageUrl: "https://img.youtube.com/vi/fkywZ6O6p6k/hqdefault.jpg",
    summary: "Aktivasi otot bokong murni di lantai untuk memperbaiki postur panggul dan kesehatan pinggang bawah.",
    researchCitation: {
      journal: "Journal of Orthopaedic & Sports Physical Therapy (JOSPT)",
      study: "Contreras et al. (2015)",
      findings: "Glute bridge memicu kontraksi puncak gluteus maximus tertinggi pada ekstensi panggul terminal tanpa beban aksial tulang belakang."
    },
    tutorial: {
      setup: [
        "Berbaring telentang di lantai dengan lutut ditekuk dan telapak kaki menapak kokoh selebar pinggul.",
        "Letakkan kedua tangan santai di samping tubuh."
],
      movement: [
        "Tekan kedua tumit ke lantai dan dorong pinggul ke atas hingga tubuh membentuk garis lurus dari bahu ke lutut.",
        "Remas otot glutes sekuat mungkin di posisi atas selama 2 detik.",
        "Turunkan pinggul perlahan kembali ke lantai."
],
      breathing: "Hembuskan napas saat mendorong pinggul ke atas, tarik napas saat menurunkan.",
      mistakes: [
        "Mendorong pinggul terlalu tinggi dengan melengkungkan pinggang bawah (hyperextension).",
        "Menumpu pada ujung jari kaki alih-alih tumit."
],
      proTip: "Kencangkan perut terlebih dahulu agar dorongan murni berasal dari otot pantat bukan otot pinggang."
    }
  },
  {
    id: "bw-calf-raise",
    name: "Standing Single-Leg Calf Raise",
    equipment: "bodyweight",
    equipmentLabel: "Bodyweight",
    primaryMuscle: ExerciseAttributeValueEnum.CALVES,
    primaryMuscleCode: "Ca",
    primaryMuscleName: "Betis (Gastrocnemius & Soleus)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Keseimbangan Kaki"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/M_SgA2C_dTU",
    fullVideoImageUrl: "https://img.youtube.com/vi/M_SgA2C_dTU/hqdefault.jpg",
    summary: "Latihan betis calisthenics unilateral untuk melatih daya lenting tendon achilles dan kekuatan betis.",
    researchCitation: {
      journal: "Journal of Applied Biomechanics",
      study: "Riemann et al. (2011)",
      findings: "Standing calf raise dengan lutut lurus memaksimalkan rekrutmen caput mediale & laterale otot gastrocnemius."
    },
    tutorial: {
      setup: [
        "Berdiri dengan ujung telapak satu kaki di tepi undakan atau lantai datar, pegang dinding untuk keseimbangan.",
        "Tekuk kaki yang satu lagi di udara."
],
      movement: [
        "Dorong ujung telapak kaki ke bawah dan angkat tumit setinggi mungkin (plantarflexion penuh).",
        "Tahan kontraksi puncak betis selama 1 detik.",
        "Turunkan tumit ke bawah perlahan hingga merasakan regangan penuh pada betis."
],
      breathing: "Hembuskan napas saat berjinjit naik, tarik napas saat menurunkan tumit.",
      mistakes: [
        "Memantul-mantulkan gerakan tanpa jeda kontraksi di atas.",
        "Menekuk lutut saat mengangkat tumit."
],
      proTip: "Tahan 1 detik di posisi jinjit paling atas untuk memaksimalkan hipertrofi otot betis yang lambat lelah."
    }
  },
  {
    id: "kb-snatch",
    name: "Single-Arm Kettlebell Snatch",
    equipment: "kettlebell",
    equipmentLabel: "Kettlebell",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Bahu & Daya Ledak Seluruh Tubuh",
    secondaryMuscles: [ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.BACK],
    secondaryMuscleNames: ["Hamstrings","Glutes","Lats"],
    difficulty: "Lanjutan",
    videoUrl: "https://www.youtube.com/shorts/q77zYvK6iZg",
    fullVideoImageUrl: "https://img.youtube.com/vi/q77zYvK6iZg/hqdefault.jpg",
    summary: "Latihan balistik tingkat lanjut untuk melatih kecepatan, daya ledak hip hinge, dan stabilitas bahu overhead.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Lake & Lauder (2012)",
      findings: "Kettlebell snatch menghasilkan mechanical power output dan rate of force development (RFD) yang sangat tinggi di seluruh rantai kinetik tubuh."
    },
    tutorial: {
      setup: [
        "Letakkan kettlebell di lantai di depan kaki, ambil posisi hip hinge.",
        "Pegang handle kettlebell dengan satu tangan."
],
      movement: [
        "Ayunkan kettlebell ke belakang di antara kedua kaki, lalu ledakkan pinggul ke depan.",
        "Tarik kettlebell ke atas dalam garis vertikal dekat dengan tubuh.",
        "Dorong tangan menembus handle di atas kepala sehingga kettlebell mendarat lembut di punggung tangan."
],
      breathing: "Tarik napas saat mengayun ke bawah, hembuskan napas kuat saat mengunci kettlebell di atas kepala.",
      mistakes: [
        "Membiarkan kettlebell menghantam pergelangan tangan dengan keras.",
        "Mengayunkan kettlebell terlalu jauh ke depan seperti swing."
],
      proTip: "Jaga kettlebell sedekat mungkin dengan tubuh seperti sedang menutup ritsleting jaket."
    }
  },
  {
    id: "kb-halo",
    name: "Kettlebell Overhead Halo",
    equipment: "kettlebell",
    equipmentLabel: "Kettlebell",
    primaryMuscle: ExerciseAttributeValueEnum.SHOULDERS,
    primaryMuscleCode: "S",
    primaryMuscleName: "Mobilitas Bahu & Rotator Cuff",
    secondaryMuscles: [ExerciseAttributeValueEnum.ABDOMINALS, ExerciseAttributeValueEnum.TRAPS],
    secondaryMuscleNames: ["Core","Upper Trapezius"],
    difficulty: "Pemula",
    videoUrl: "https://www.youtube.com/shorts/sF7Hk_G6r10",
    fullVideoImageUrl: "https://img.youtube.com/vi/sF7Hk_G6r10/hqdefault.jpg",
    summary: "Gerakan melingkar mengitari kepala untuk meningkatkan kesehatan kapsul bahu, mobilitas toraks, dan stabilitas inti.",
    researchCitation: {
      journal: "International Journal of Sports Physical Therapy",
      study: "Brumitt et al. (2010)",
      findings: "Kettlebell halo mengaktifkan otot rotator cuff (supraspinatus, infraspinatus) dan stabilisator skapula dalam berbagai bidang gerak rotasional."
    },
    tutorial: {
      setup: [
        "Pegang kettlebell terbalik di depan dada dengan kedua tangan memegang tanduk handle.",
        "Berdiri tegak dengan kaki dibuka selebar bahu dan kunci otot perut."
],
      movement: [
        "Putar kettlebell mengitari kepala sedekat mungkin tanpa menyentuh leher.",
        "Bawa kembali kettlebell ke depan dada.",
        "Ulangi gerakan dengan arah putaran sebaliknya."
],
      breathing: "Bernapaslah dengan tenang dan berirama sepanjang rotasi gerakan.",
      mistakes: [
        "Menggoyangkan pinggul atau memutar leher (kepala harus tetap diam menghadap depan).",
        "Menggunakan kettlebell yang terlalu berat."
],
      proTip: "Hanya lengan Anda yang berputar mengitari kepala; kepala dan tubuh Anda harus tetap kokoh tegak seperti batu karang."
    }
  },
  {
    id: "plate-pinch-carry",
    name: "Plate Pinch Grip Farmer Walk",
    equipment: "plate",
    equipmentLabel: "Plate",
    primaryMuscle: ExerciseAttributeValueEnum.FOREARMS,
    primaryMuscleCode: "F",
    primaryMuscleName: "Lengan Bawah & Cengkeraman (Grip Strength)",
    secondaryMuscles: [ExerciseAttributeValueEnum.TRAPS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Trapezius","Core Stabilizer"],
    difficulty: "Menengah",
    videoUrl: "https://www.youtube.com/shorts/Y1m2F_dO3m4",
    fullVideoImageUrl: "https://img.youtube.com/vi/Y1m2F_dO3m4/hqdefault.jpg",
    summary: "Latihan cengkeraman jari statis ekstrem untuk membangun kekuatan pergelangan tangan dan otot lengan bawah.",
    researchCitation: {
      journal: "Journal of Strength & Conditioning Research (JSCR)",
      study: "Winwood et al. (2014)",
      findings: "Loaded carries dengan pinch grip memaksimalkan aktivasi flexor digitorum dan otot penstabil lumbal secara simultan."
    },
    tutorial: {
      setup: [
        "Jepit satu atau dua plat beban halus menggunakan ujung jari-jari tangan (tanpa menyentuh bibir lubang plat).",
        "Berdiri tegak dengan postur dada tegap dan bahu ditarik ke belakang."
],
      movement: [
        "Berjalanlah perlahan ke depan dengan langkah kecil dan terkontrol sepanjang 15-20 meter.",
        "Pertahankan cengkeraman jari tangan tetap mengunci rapat.",
        "Turunkan plat dengan menekuk lutut (squat) saat repetisi selesai."
],
      breathing: "Pertahankan pernapasan diafragma yang stabil selama melangkah.",
      mistakes: [
        "Bahu merosot jatuh ke depan.",
        "Menjatuhkan plat secara tiba-tiba ke jari kaki."
],
      proTip: "Keringkan telapak tangan atau gunakan kapur gym (chalk) untuk mencegah selip."
    }
  }
];
