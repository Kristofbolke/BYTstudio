-- 021_projecten_account_info.sql
-- Voegt account-info toe voor hosting (Netlify/Vercel) en Supabase per project
-- Voer uit in Supabase Dashboard → SQL Editor

ALTER TABLE projecten
  ADD COLUMN IF NOT EXISTS hosting_provider     TEXT,   -- 'netlify' | 'vercel'
  ADD COLUMN IF NOT EXISTS hosting_login        TEXT,
  ADD COLUMN IF NOT EXISTS hosting_wachtwoord   TEXT,
  ADD COLUMN IF NOT EXISTS hosting_type_account TEXT,

  ADD COLUMN IF NOT EXISTS supabase_login        TEXT,
  ADD COLUMN IF NOT EXISTS supabase_wachtwoord   TEXT,
  ADD COLUMN IF NOT EXISTS supabase_organisatie  TEXT,
  ADD COLUMN IF NOT EXISTS supabase_project      TEXT,
  ADD COLUMN IF NOT EXISTS supabase_type_account TEXT,
  ADD COLUMN IF NOT EXISTS supabase_url          TEXT;
