-- Add archetype column to enrollments table
ALTER TABLE public.enrollments
ADD COLUMN archetype text;

-- Add comment for documentation
COMMENT ON COLUMN public.enrollments.archetype IS 'Role archetype from the La Cordada assessment (e.g., Guía de Alta Montaña, Primer de Cuerda, etc.)';