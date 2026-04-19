-- Voeg bijgewerkt_op toe aan handleidingen + auto-update trigger
ALTER TABLE handleidingen ADD COLUMN IF NOT EXISTS bijgewerkt_op TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION set_handleiding_bijgewerkt_op()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.bijgewerkt_op = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handleidingen_bijgewerkt_op ON handleidingen;
CREATE TRIGGER handleidingen_bijgewerkt_op
  BEFORE UPDATE ON handleidingen
  FOR EACH ROW EXECUTE FUNCTION set_handleiding_bijgewerkt_op();
