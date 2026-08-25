-- 023_klanten_uitbreiding.sql — Volledige klantfiche + contactpersonen
-- Voer uit in Supabase Dashboard → SQL Editor
--
-- Breidt de klanten-tabel uit met de velden die KlantDetail.jsx nodig heeft
-- (bedrijfsgegevens, adres, financieel) en voegt een aparte contactpersonen-
-- tabel toe (meerdere contactpersonen per klant, één ervan optioneel primair).
--
-- Idempotent: veilig om meermaals uit te voeren, ook als een vorige poging
-- al gedeeltelijk slaagde (elke stap gebruikt IF NOT EXISTS / DROP...IF EXISTS).

ALTER TABLE klanten
  -- Bedrijf
  ADD COLUMN IF NOT EXISTS handelsnaam         TEXT,
  ADD COLUMN IF NOT EXISTS ondernemingsnummer  TEXT,
  ADD COLUMN IF NOT EXISTS website             TEXT,
  ADD COLUMN IF NOT EXISTS taal_correspondentie TEXT NOT NULL DEFAULT 'NL'
    CHECK (taal_correspondentie IN ('NL', 'FR', 'EN')),
  ADD COLUMN IF NOT EXISTS status               TEXT NOT NULL DEFAULT 'actief'
    CHECK (status IN ('actief', 'inactief', 'prospect')),
  -- Adres
  ADD COLUMN IF NOT EXISTS straat      TEXT,
  ADD COLUMN IF NOT EXISTS huisnummer  TEXT,
  ADD COLUMN IF NOT EXISTS postcode    TEXT,
  ADD COLUMN IF NOT EXISTS gemeente    TEXT,
  ADD COLUMN IF NOT EXISTS provincie   TEXT,
  ADD COLUMN IF NOT EXISTS land        TEXT NOT NULL DEFAULT 'België',
  -- Financieel
  ADD COLUMN IF NOT EXISTS facturatie_email TEXT,
  ADD COLUMN IF NOT EXISTS iban             TEXT,
  ADD COLUMN IF NOT EXISTS bic              TEXT,
  ADD COLUMN IF NOT EXISTS betalingstermijn INTEGER NOT NULL DEFAULT 30
    CHECK (betalingstermijn IN (15, 30, 45, 60)),
  ADD COLUMN IF NOT EXISTS btw_regime        TEXT NOT NULL DEFAULT 'normaal'
    CHECK (btw_regime IN ('normaal', 'vrijgesteld', 'medecontractant'));

COMMENT ON COLUMN klanten.status IS
  'actief = huidige klant, inactief = geen lopende samenwerking meer, prospect = nog geen klant';
COMMENT ON COLUMN klanten.aangemaakt_op IS
  'Ook gebruikt als "klant sinds"-datum op de klantfiche';

-- ── Contactpersonen ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contactpersonen (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  klant_id          uuid REFERENCES klanten(id) ON DELETE CASCADE NOT NULL,
  voornaam          TEXT NOT NULL,
  achternaam        TEXT,
  functie           TEXT,
  email             TEXT,
  gsm               TEXT,
  telefoon          TEXT,
  primair_contact   BOOLEAN NOT NULL DEFAULT false,
  notities          TEXT,
  aangemaakt_op     TIMESTAMPTZ DEFAULT now(),
  bijgewerkt_op     TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_contactpersoon_bijgewerkt_op()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.bijgewerkt_op = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contactpersonen_bijgewerkt_op ON contactpersonen;
CREATE TRIGGER contactpersonen_bijgewerkt_op
  BEFORE UPDATE ON contactpersonen
  FOR EACH ROW EXECUTE FUNCTION set_contactpersoon_bijgewerkt_op();

ALTER TABLE contactpersonen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_volledig" ON contactpersonen;
CREATE POLICY "auth_volledig" ON contactpersonen
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
