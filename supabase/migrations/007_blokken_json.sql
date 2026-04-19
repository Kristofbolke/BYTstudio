-- Voeg blokken_json toe aan projecten
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS blokken_json JSONB;
