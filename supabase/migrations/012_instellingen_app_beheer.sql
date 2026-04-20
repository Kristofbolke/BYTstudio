-- 012_instellingen_app_beheer.sql
-- Voegt app-beheer instellingen toe
-- Voer uit in Supabase Dashboard → SQL Editor

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS standaard_projectstatus TEXT DEFAULT 'intake',
  ADD COLUMN IF NOT EXISTS standaard_handleiding_versie TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS standaard_auteur_handleiding TEXT DEFAULT 'Build Your Tools';
