-- 010_instellingen_logo.sql
-- Voegt logo_url toe aan de instellingen-tabel
-- Voer uit in Supabase Dashboard → SQL Editor

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
