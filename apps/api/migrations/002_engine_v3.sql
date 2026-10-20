-- Engine v3: more barrel shapes (bomb, scalloped) and a stored physics check per variant.
ALTER TABLE dart_models DROP CONSTRAINT IF EXISTS dart_models_shape_check;
ALTER TABLE dart_models ADD CONSTRAINT dart_models_shape_check
  CHECK (shape IN ('straight','torpedo','tapered','bomb','scalloped'));
ALTER TABLE dart_variants ADD COLUMN IF NOT EXISTS spec_check jsonb;
