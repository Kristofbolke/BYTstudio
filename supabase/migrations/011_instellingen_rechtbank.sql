-- 011_instellingen_rechtbank.sql
-- Voegt rechtbank-veld toe aan instellingen
-- Voer uit in Supabase Dashboard → SQL Editor

ALTER TABLE instellingen
  ADD COLUMN IF NOT EXISTS rechtbank TEXT DEFAULT 'arrondissement Gent';
