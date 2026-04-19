-- Voeg uurtarief toe aan instellingen
ALTER TABLE instellingen ADD COLUMN IF NOT EXISTS uurtarief NUMERIC DEFAULT 75;
