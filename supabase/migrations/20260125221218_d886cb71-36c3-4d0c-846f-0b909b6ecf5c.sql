-- Add new columns for structured budget
ALTER TABLE public.cordadas 
ADD COLUMN IF NOT EXISTS budget_currency text DEFAULT 'CLP',
ADD COLUMN IF NOT EXISTS budget_amount numeric;

-- Migrate existing budget_range data if possible (optional, may not parse perfectly)
-- We'll keep budget_range for now as a fallback

-- Add a constraint to ensure valid currency values
ALTER TABLE public.cordadas
ADD CONSTRAINT valid_budget_currency CHECK (budget_currency IN ('UF', 'CLP', 'USD') OR budget_currency IS NULL);