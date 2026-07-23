
CREATE TYPE public.cordada_visibility_mode AS ENUM ('curated', 'open_filtered');

ALTER TABLE public.cordadas
  ADD COLUMN visibility_mode public.cordada_visibility_mode NOT NULL DEFAULT 'curated',
  ADD COLUMN open_filters jsonb;

CREATE INDEX cordadas_visibility_status_idx ON public.cordadas (visibility_mode, status);

CREATE OR REPLACE FUNCTION public.consultant_matches_cordada(_user_id uuid, _cordada_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  f jsonb;
  req_archetypes text[];
  req_min_level text;
  req_expertise text[];
  req_available boolean;
  app_archetype text;
  app_level text;
  prof_expertise text[];
  prof_available boolean;
  level_rank int;
  req_rank int;
BEGIN
  SELECT open_filters INTO f FROM public.cordadas WHERE id = _cordada_id;

  -- Hardened guard: require at least one EFFECTIVE filter.
  IF f IS NULL
     OR ( COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(f->'archetypes') = 'array' THEN f->'archetypes' ELSE NULL END), 0) = 0
          AND (f->>'min_maturity_level') IS NULL
          AND COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(f->'expertise_tags') = 'array' THEN f->'expertise_tags' ELSE NULL END), 0) = 0
          AND COALESCE((f->>'availability_required')::boolean, false) = false )
  THEN
    RETURN false;
  END IF;

  SELECT ca.archetype::text, ca.maturity_level
    INTO app_archetype, app_level
    FROM public.consultant_applications ca
   WHERE ca.user_id = _user_id AND ca.status = 'aceptado'
   LIMIT 1;
  IF app_archetype IS NULL THEN RETURN false; END IF;

  SELECT cp.expertise, cp.is_available
    INTO prof_expertise, prof_available
    FROM public.consultant_profiles cp
   WHERE cp.user_id = _user_id
   LIMIT 1;

  IF jsonb_typeof(f->'archetypes') = 'array' THEN
    req_archetypes := ARRAY(SELECT jsonb_array_elements_text(f->'archetypes'));
    IF array_length(req_archetypes,1) IS NOT NULL
       AND NOT (app_archetype = ANY(req_archetypes)) THEN
      RETURN false;
    END IF;
  END IF;

  req_min_level := f->>'min_maturity_level';
  IF req_min_level IS NOT NULL THEN
    level_rank := CASE app_level
      WHEN 'Guía' THEN 3
      WHEN 'Alta Montaña' THEN 2
      WHEN 'Tramo de Ascenso' THEN 1
      WHEN 'Campamento Base' THEN 0
      ELSE 0 END;
    req_rank := CASE req_min_level
      WHEN 'Guía' THEN 3
      WHEN 'Alta Montaña' THEN 2
      WHEN 'Tramo de Ascenso' THEN 1
      WHEN 'Campamento Base' THEN 0
      ELSE 0 END;
    IF level_rank < req_rank THEN RETURN false; END IF;
  END IF;

  IF jsonb_typeof(f->'expertise_tags') = 'array' THEN
    req_expertise := ARRAY(SELECT jsonb_array_elements_text(f->'expertise_tags'));
    IF array_length(req_expertise,1) IS NOT NULL THEN
      IF prof_expertise IS NULL OR NOT (prof_expertise && req_expertise) THEN
        RETURN false;
      END IF;
    END IF;
  END IF;

  req_available := COALESCE((f->>'availability_required')::boolean, false);
  IF req_available AND COALESCE(prof_available, false) = false THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consultant_matches_cordada(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consultant_matches_cordada(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.consultant_matches_cordada(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Consultants can view matching open cordadas"
ON public.cordadas FOR SELECT TO authenticated
USING (
  visibility_mode = 'open_filtered'
  AND status = 'convocatoria'
  AND public.consultant_matches_cordada(auth.uid(), cordadas.id)
);
