-- ============================================================================
-- Ayo-Olahraga: 100x Architecture Schema (PostgreSQL)
-- Focus: Offline-sync friendly, Biomechanical Heatmap, Progressive Overload PR
-- ============================================================================

-- 1. CUSTOM ENUMS
CREATE TYPE muscle_region AS ENUM ('upper', 'lower', 'core');
CREATE TYPE muscle_role AS ENUM ('primary', 'secondary', 'stabilizer');
CREATE TYPE mechanics_type AS ENUM ('compound', 'isolation');
CREATE TYPE force_type AS ENUM ('push', 'pull', 'static');
CREATE TYPE set_type AS ENUM ('normal', 'warmup', 'drop', 'failure');
CREATE TYPE pr_type AS ENUM ('max_weight', 'max_reps', 'max_volume', 'est_1rm');

-- 2. USERS & AUTH (Better-Auth compatible)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferred_unit TEXT DEFAULT 'kg' NOT NULL, -- 'kg' or 'lbs'
    auto_rest_timer BOOLEAN DEFAULT TRUE NOT NULL,
    default_rest_seconds INTEGER DEFAULT 90 NOT NULL,
    sound_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    vibration_alerts BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. ANATOMY & MUSCLES (For 3D / SVG Heatmap)
CREATE TABLE IF NOT EXISTS muscles (
    id TEXT PRIMARY KEY,                       -- e.g. 'pectoralis-major', 'latissimus-dorsi'
    name TEXT NOT NULL,                        -- e.g. 'Chest', 'Lats'
    name_scientific TEXT,                      -- e.g. 'Pectoralis Major'
    region muscle_region NOT NULL,             -- 'upper', 'lower', 'core'
    svg_layer_id TEXT NOT NULL,                -- Identifier inside SVG anatomic map
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. EQUIPMENT
CREATE TABLE IF NOT EXISTS equipments (
    id TEXT PRIMARY KEY,                       -- e.g. 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'
    name TEXT NOT NULL,
    icon_name TEXT,                            -- Lucide icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. EXERCISES (Self-hosted lightweight media + biomechanics)
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    instructions JSONB DEFAULT '[]'::JSONB,    -- Array of steps: ["Grip bar...", "Lower to chest..."]
    video_url TEXT,                            -- Ultra-compressed 500KB loop WebM/MP4
    thumbnail_url TEXT,
    mechanics mechanics_type,                  -- 'compound', 'isolation'
    force force_type,                          -- 'push', 'pull', 'static'
    is_custom BOOLEAN DEFAULT FALSE NOT NULL,
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Many-to-many: Exercises <-> Muscles (Heatmap weight factor: 1.0 primary, 0.5 secondary)
CREATE TABLE IF NOT EXISTS exercise_muscles (
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    muscle_id TEXT NOT NULL REFERENCES muscles(id) ON DELETE CASCADE,
    role muscle_role NOT NULL DEFAULT 'primary',
    fatigue_factor NUMERIC(3,2) DEFAULT 1.00 NOT NULL, -- 1.00 = 100% strain, 0.50 = 50% strain
    PRIMARY KEY (exercise_id, muscle_id)
);

-- Many-to-many: Exercises <-> Equipments
CREATE TABLE IF NOT EXISTS exercise_equipments (
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    equipment_id TEXT NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    PRIMARY KEY (exercise_id, equipment_id)
);

-- 6. WORKOUT TEMPLATES (Routine builder)
CREATE TABLE IF NOT EXISTS workout_templates (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,                       -- e.g. 'Upper Power A'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_template_exercises (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    template_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    order_index INTEGER NOT NULL,
    superset_group_id TEXT,                    -- Exercises sharing same superset group
    target_sets INTEGER DEFAULT 3 NOT NULL,
    target_reps TEXT DEFAULT '8-12',           -- e.g. '8-12' or '5'
    target_rpe NUMERIC(3,1),                   -- e.g. 8.0
    rest_seconds INTEGER DEFAULT 90 NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. LIVE SESSIONS & LOGGING (Gym mode)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id TEXT REFERENCES workout_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    overall_rpe NUMERIC(3,1),                  -- Rating of perceived exertion (1-10)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_session_exercises (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
    order_index INTEGER NOT NULL,
    superset_group_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    session_exercise_id TEXT NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    set_type set_type DEFAULT 'normal' NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    reps INTEGER NOT NULL DEFAULT 0,
    rpe NUMERIC(3,1),                          -- Rate of perceived exertion (6.0 - 10.0)
    rir INTEGER,                               -- Reps in reserve (0 - 5)
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    rest_seconds INTEGER,                      -- Actual rest taken before this set
    est_1rm NUMERIC(6,2),                      -- Auto calculated 1RM (Epley: w * (1 + r/30))
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. PERSONAL RECORDS (PR TRACKER)
CREATE TABLE IF NOT EXISTS personal_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    pr_type pr_type NOT NULL,
    value NUMERIC(8,2) NOT NULL,               -- Weight or Calculated 1RM or Reps
    workout_set_id TEXT REFERENCES workout_sets(id) ON DELETE SET NULL,
    achieved_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, exercise_id, pr_type)
);

-- 9. BODY MEASUREMENTS & STATS
CREATE TABLE IF NOT EXISTS body_measurements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_at DATE NOT NULL,
    weight_kg NUMERIC(5,2),
    body_fat_percentage NUMERIC(4,1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, logged_at)
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_exercises_slug ON exercises(slug);
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_muscle ON exercise_muscles(muscle_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON workout_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sets_session_exercise ON workout_sets(session_exercise_id);
CREATE INDEX IF NOT EXISTS idx_pr_user_exercise ON personal_records(user_id, exercise_id);

