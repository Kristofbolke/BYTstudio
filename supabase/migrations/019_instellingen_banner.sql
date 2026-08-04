-- 019_instellingen_banner.sql
-- Voegt app-header instellingen toe aan de instellingen-tabel
-- Voer uit in Supabase Dashboard → SQL Editor

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS banner_zichtbaar BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS banner_titel     TEXT    DEFAULT 'Welkom bij Build Your Tools',
  ADD COLUMN IF NOT EXISTS banner_subtitel  TEXT    DEFAULT 'Slimme apps voor slimme bedrijven';
