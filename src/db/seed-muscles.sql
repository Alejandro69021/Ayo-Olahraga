-- Seed data untuk anatomi otot & heatmap SVG
INSERT INTO muscles (id, name, name_scientific, region, svg_layer_id) VALUES
('chest-upper', 'Upper Chest', 'Pectoralis Major (Clavicular)', 'upper', 'muscle_chest_upper'),
('chest-lower', 'Lower Chest', 'Pectoralis Major (Sternal)', 'upper', 'muscle_chest_lower'),
('lats', 'Lats', 'Latissimus Dorsi', 'upper', 'muscle_lats'),
('deltoid-anterior', 'Front Delts', 'Deltoid (Anterior)', 'upper', 'muscle_delt_front'),
('deltoid-lateral', 'Side Delts', 'Deltoid (Lateral)', 'upper', 'muscle_delt_side'),
('deltoid-posterior', 'Rear Delts', 'Deltoid (Posterior)', 'upper', 'muscle_delt_rear'),
('biceps', 'Biceps', 'Biceps Brachii', 'upper', 'muscle_biceps'),
('triceps', 'Triceps', 'Triceps Brachii', 'upper', 'muscle_triceps'),
('trapezius', 'Traps', 'Trapezius', 'upper', 'muscle_traps'),
('forearms', 'Forearms', 'Brachioradialis & Flexors', 'upper', 'muscle_forearms'),
('abs', 'Abs', 'Rectus Abdominis', 'core', 'muscle_abs'),
('obliques', 'Obliques', 'External Obliques', 'core', 'muscle_obliques'),
('quadriceps', 'Quads', 'Quadriceps Femoris', 'lower', 'muscle_quads'),
('hamstrings', 'Hamstrings', 'Biceps Femoris', 'lower', 'muscle_hamstrings'),
('glutes', 'Glutes', 'Gluteus Maximus', 'lower', 'muscle_glutes'),
('calves', 'Calves', 'Gastrocnemius & Soleus', 'lower', 'muscle_calves')
ON CONFLICT (id) DO NOTHING;

-- Seed data alat gym
INSERT INTO equipments (id, name, icon_name) VALUES
('barbell', 'Barbell', 'Dumbbell'),
('dumbbell', 'Dumbbell', 'Dumbbell'),
('cable', 'Cable Machine', 'Cable'),
('machine', 'Pin/Plate Machine', 'Cog'),
('bodyweight', 'Bodyweight', 'User'),
('kettlebell', 'Kettlebell', 'Weight'),
('resistance-band', 'Resistance Band', 'Activity')
ON CONFLICT (id) DO NOTHING;

