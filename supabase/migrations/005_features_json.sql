-- Voeg features_json kolom toe aan projecten
ALTER TABLE projecten ADD COLUMN IF NOT EXISTS features_json JSONB;
