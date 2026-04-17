-- ─── Ella App — Supabase schema ─────────────────────────────────────────────
--
-- Tabla única key/value que espeja la estructura de localStorage.
-- Cada fila = un key ella_* por usuario.
-- RLS garantiza que cada usuario solo ve sus propios datos.
--
-- Para ejecutar: pega este SQL en Supabase → SQL Editor → Run

-- ── Tabla principal ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ella_data (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key        TEXT        NOT NULL,
  value      JSONB       NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, key)
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE ella_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios gestionan sus propios datos"
  ON ella_data FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Auto-update de updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ella_data_updated_at
  BEFORE UPDATE ON ella_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Índice para queries rápidas por usuario ────────────────────────────────────
CREATE INDEX IF NOT EXISTS ella_data_user_id_idx ON ella_data (user_id);
CREATE INDEX IF NOT EXISTS ella_data_key_idx      ON ella_data (user_id, key);
