import { ExerciseAttributeValueEnum } from "@/components/muscles/types";
import type { ExerciseDetail } from "@/data/exercises";

/**
 * Empat gerakan tambahan untuk menutup celah katalog (hamstring, bokong, betis, trisep dengan beban).
 * Semuanya memakai RuleSet Form Coach yang SUDAH ada (hinge, bridge, calf, triceps-ext).
 *
 * Sengaja TIDAK ada: videoUrl, fullVideoImageUrl, researchCitation. Tidak boleh mengarang tautan video
 * atau kutipan jurnal. Isi sendiri tautan YouTube yang sudah kamu tonton dan pastikan sesuai gerakannya.
 */
export const NEW_EXERCISES: ExerciseDetail[] = [
  {
    id: "db-romanian-deadlift",
    name: "Dumbbell Romanian Deadlift (RDL)",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.HAMSTRINGS,
    primaryMuscleCode: "H",
    primaryMuscleName: "Paha Belakang & Pinggul (Hamstrings & Glutes)",
    secondaryMuscles: [ExerciseAttributeValueEnum.GLUTES, ExerciseAttributeValueEnum.BACK],
    secondaryMuscleNames: ["Pantat (Glutes)", "Erector Spinae"],
    difficulty: "Pemula",
    summary: "Engsel pinggul dengan dua dumbel: melatih hamstring dan bokong dengan beban yang lebih mudah diatur daripada barbel.",
    tutorial: {
      setup: [
        "Berdiri tegak memegang dumbel di depan paha, telapak tangan menghadap tubuh, kaki selebar pinggul.",
        "Tekuk lutut sedikit dan pertahankan tekukan itu tetap sama sepanjang gerakan.",
      ],
      movement: [
        "Dorong pinggul jauh ke belakang sambil menurunkan dumbel menyusuri paha dan tulang kering.",
        "Turun sampai hamstring terasa terenggang, punggung tetap lurus.",
        "Dorong pinggul ke depan untuk berdiri tegak sambil meremas bokong.",
      ],
      breathing: "Tarik napas saat turun, hembuskan napas saat mendorong pinggul ke depan.",
      mistakes: [
        "Menekuk lutut terlalu banyak sehingga berubah menjadi squat.",
        "Dumbel menjauh dari tubuh sehingga punggung bawah menanggung beban lebih.",
      ],
      proTip: "Bayangkan menutup pintu di belakang Anda dengan pantat; dumbel tetap dekat tubuh.",
    },
    formCoach: {
      ruleSetId: "hinge",
      view: "side",
      cameraTip: "Letakkan HP setinggi pinggul, 2–3 meter di samping Anda, fokus engsel pinggul.",
    },
  },
  {
    id: "db-glute-bridge",
    name: "Dumbbell Glute Bridge",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.GLUTES,
    primaryMuscleCode: "G",
    primaryMuscleName: "Pantat / Pinggul (Gluteus Maximus)",
    secondaryMuscles: [ExerciseAttributeValueEnum.HAMSTRINGS, ExerciseAttributeValueEnum.ABDOMINALS],
    secondaryMuscleNames: ["Paha Belakang", "Core"],
    difficulty: "Pemula",
    summary: "Glute bridge di lantai dengan dumbel di pinggul: cara sederhana menambah beban untuk otot bokong tanpa bangku.",
    tutorial: {
      setup: [
        "Berbaring telentang, lutut ditekuk, telapak kaki menapak selebar pinggul.",
        "Letakkan satu dumbel di lipatan pinggul dan tahan dengan kedua tangan.",
      ],
      movement: [
        "Tekan tumit ke lantai dan dorong pinggul ke atas sampai bahu, pinggul, dan lutut hampir segaris.",
        "Remas bokong sekitar 1–2 detik di atas.",
        "Turunkan pinggul perlahan sampai hampir menyentuh lantai.",
      ],
      breathing: "Hembuskan napas saat mendorong naik, tarik napas saat turun.",
      mistakes: [
        "Melengkungkan punggung bawah berlebihan di atas.",
        "Menumpu pada ujung kaki, bukan tumit.",
      ],
      proTip: "Alasi dumbel dengan handuk bila terasa menekan tulang pinggul.",
    },
    formCoach: {
      ruleSetId: "bridge",
      view: "side",
      cameraTip: "Letakkan HP dekat lantai, 2 meter di samping Anda, tubuh dari bahu sampai lutut terlihat penuh.",
    },
  },
  {
    id: "db-standing-calf-raise",
    name: "Dumbbell Standing Calf Raise",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.CALVES,
    primaryMuscleCode: "Ca",
    primaryMuscleName: "Betis (Gastrocnemius & Soleus)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Genggaman"],
    difficulty: "Pemula",
    summary: "Angkat tumit sambil memegang dumbel untuk menambah beban pada betis.",
    tutorial: {
      setup: [
        "Berdiri dengan ujung telapak kaki di tepi undakan atau lantai datar, pegang dumbel di satu atau kedua tangan.",
        "Pegangan dinding atau tiang bila perlu untuk keseimbangan.",
      ],
      movement: [
        "Angkat kedua tumit setinggi mungkin dengan lutut tetap lurus.",
        "Tahan sebentar di puncak.",
        "Turunkan tumit perlahan sampai betis terasa terenggang.",
      ],
      breathing: "Hembuskan napas saat naik, tarik napas saat turun.",
      mistakes: [
        "Memantul tanpa jeda di atas.",
        "Menekuk lutut saat mengangkat tumit.",
      ],
      proTip: "Gerakan turun yang lambat membuat betis bekerja lebih lama per repetisi.",
    },
    formCoach: {
      ruleSetId: "calf",
      view: "side",
      cameraTip: "Letakkan HP setinggi lutut, 1,5–2 meter di samping Anda, tungkai bawah terlihat jelas.",
    },
  },
  {
    id: "db-overhead-triceps-extension",
    name: "Dumbbell Overhead Triceps Extension",
    equipment: "dumbbell",
    equipmentLabel: "Dumbbell",
    primaryMuscle: ExerciseAttributeValueEnum.TRICEPS,
    primaryMuscleCode: "T",
    primaryMuscleName: "Lengan Belakang (Triceps)",
    secondaryMuscles: [ExerciseAttributeValueEnum.FOREARMS],
    secondaryMuscleNames: ["Stabilisator Pergelangan"],
    difficulty: "Pemula",
    summary: "Isolasi trisep dengan satu dumbel di atas kepala, bisa dilakukan sambil berdiri atau duduk.",
    tutorial: {
      setup: [
        "Berdiri atau duduk tegak, pegang satu dumbel dengan kedua tangan di atas kepala, lengan lurus.",
        "Rapatkan siku ke arah kepala dan kencangkan perut.",
      ],
      movement: [
        "Tekuk siku untuk menurunkan dumbel ke belakang kepala, lengan atas tetap diam.",
        "Turun sampai siku sekitar 90 derajat atau selama masih nyaman di bahu.",
        "Luruskan siku untuk mengangkat dumbel kembali ke atas.",
      ],
      breathing: "Tarik napas saat menurunkan dumbel, hembuskan napas saat meluruskan siku.",
      mistakes: [
        "Siku melebar ke samping.",
        "Punggung melengkung ke belakang saat dumbel naik.",
      ],
      proTip: "Mulai dengan beban ringan; sendi bahu dan siku lebih rentan pada posisi di atas kepala.",
    },
    formCoach: {
      ruleSetId: "triceps-ext",
      view: "side",
      cameraTip: "Letakkan HP setinggi dada, 2–3 meter di samping Anda, lengan atas dan siku terlihat jelas.",
    },
  },
];
