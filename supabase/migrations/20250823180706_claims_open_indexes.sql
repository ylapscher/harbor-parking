-- Claims: allow historical re-claim and enforce at most 1 OPEN claim per availability

-- 1) Remove the rigid UNIQUE constraint (it blocks re-claiming)
ALTER TABLE public.claims
  DROP CONSTRAINT IF EXISTS claims_availability_id_claimer_id_key;

-- 2) Prevent duplicate OPEN claims for the same (availability, claimer)
CREATE UNIQUE INDEX IF NOT EXISTS claims_uq_availability_claimer_open
ON public.claims (availability_id, claimer_id)
WHERE status IN ('pending','confirmed');

-- 3) Enforce at most 1 OPEN claim per availability (regardless of claimer)
CREATE UNIQUE INDEX IF NOT EXISTS claims_uq_availability_open
ON public.claims (availability_id)
WHERE status IN ('pending','confirmed');
