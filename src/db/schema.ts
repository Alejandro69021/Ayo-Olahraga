import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  date,
  primaryKey,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

// 1. Enums
export const muscleRegionEnum = pgEnum("muscle_region", ["upper", "lower", "core"]);
export const muscleRoleEnum = pgEnum("muscle_role", ["primary", "secondary", "stabilizer"]);
export const mechanicsTypeEnum = pgEnum("mechanics_type", ["compound", "isolation"]);
export const forceTypeEnum = pgEnum("force_type", ["push", "pull", "static"]);
export const setTypeEnum = pgEnum("set_type", ["normal", "warmup", "drop", "failure"]);
export const prTypeEnum = pgEnum("pr_type", ["max_weight", "max_reps", "max_volume", "est_1rm"]);

// 2. Users & Settings
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  preferredUnit: text("preferred_unit").default("kg").notNull(),
  autoRestTimer: boolean("auto_rest_timer").default(true).notNull(),
  defaultRestSeconds: integer("default_rest_seconds").default(90).notNull(),
  soundAlerts: boolean("sound_alerts").default(true).notNull(),
  vibrationAlerts: boolean("vibration_alerts").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Anatomy & Equipment
export const muscles = pgTable("muscles", {
  id: text("id").primaryKey(), // 'pectoralis-major', 'latissimus-dorsi'
  name: text("name").notNull(),
  nameScientific: text("name_scientific"),
  region: muscleRegionEnum("region").notNull(),
  svgLayerId: text("svg_layer_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const equipments = pgTable("equipments", {
  id: text("id").primaryKey(), // 'barbell', 'dumbbell', 'cable'
  name: text("name").notNull(),
  iconName: text("icon_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Exercises
export const exercises = pgTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    instructions: jsonb("instructions").$type<string[]>().default([]),
    videoUrl: text("video_url"),
    thumbnailUrl: text("thumbnail_url"),
    mechanics: mechanicsTypeEnum("mechanics"),
    force: forceTypeEnum("force"),
    isCustom: boolean("is_custom").default(false).notNull(),
    createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_exercises_slug").on(table.slug)]
);

export const exerciseMuscles = pgTable(
  "exercise_muscles",
  {
    exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
    muscleId: text("muscle_id").notNull().references(() => muscles.id, { onDelete: "cascade" }),
    role: muscleRoleEnum("role").default("primary").notNull(),
    fatigueFactor: numeric("fatigue_factor", { precision: 3, scale: 2 }).default("1.00").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.exerciseId, table.muscleId] }),
    index("idx_exercise_muscles_muscle").on(table.muscleId),
  ]
);

export const exerciseEquipments = pgTable(
  "exercise_equipments",
  {
    exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
    equipmentId: text("equipment_id").notNull().references(() => equipments.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.exerciseId, table.equipmentId] })]
);

// 5. Workout Templates
export const workoutTemplates = pgTable("workout_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workoutTemplateExercises = pgTable("workout_template_exercises", {
  id: text("id").primaryKey(),
  templateId: text("template_id").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "restrict" }),
  orderIndex: integer("order_index").notNull(),
  supersetGroupId: text("superset_group_id"),
  targetSets: integer("target_sets").default(3).notNull(),
  targetReps: text("target_reps").default("8-12").notNull(),
  targetRpe: numeric("target_rpe", { precision: 3, scale: 1 }),
  restSeconds: integer("rest_seconds").default(90).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Live Workout Sessions
export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    templateId: text("template_id").references(() => workoutTemplates.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    overallRpe: numeric("overall_rpe", { precision: 3, scale: 1 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_sessions_user_date").on(table.userId, table.startedAt)]
);

export const workoutSessionExercises = pgTable("workout_session_exercises", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "restrict" }),
  orderIndex: integer("order_index").notNull(),
  supersetGroupId: text("superset_group_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: text("id").primaryKey(),
    sessionExerciseId: text("session_exercise_id").notNull().references(() => workoutSessionExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    setType: setTypeEnum("set_type").default("normal").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }).default("0.00").notNull(),
    reps: integer("reps").default(0).notNull(),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    rir: integer("rir"),
    isCompleted: boolean("is_completed").default(false).notNull(),
    restSeconds: integer("rest_seconds"),
    est1rm: numeric("est_1rm", { precision: 6, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_sets_session_exercise").on(table.sessionExerciseId)]
);

// 7. Personal Records (PR)
export const personalRecords = pgTable(
  "personal_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
    prType: prTypeEnum("pr_type").notNull(),
    value: numeric("value", { precision: 8, scale: 2 }).notNull(),
    workoutSetId: text("workout_set_id").references(() => workoutSets.id, { onDelete: "set null" }),
    achievedAt: timestamp("achieved_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("uq_user_exercise_pr").on(table.userId, table.exerciseId, table.prType),
    index("idx_pr_user_exercise").on(table.userId, table.exerciseId),
  ]
);

// 8. Body Stats
export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    loggedAt: date("logged_at").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    bodyFatPercentage: numeric("body_fat_percentage", { precision: 4, scale: 1 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("uq_user_logged_date").on(table.userId, table.loggedAt)]
);

