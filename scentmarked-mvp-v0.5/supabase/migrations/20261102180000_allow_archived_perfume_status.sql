-- Retain duplicate Atlas research records without publishing them.
-- Archived perfumes remain available to administrators for review and recovery.
ALTER TABLE public.perfumes DROP CONSTRAINT IF EXISTS perfumes_status_check;
ALTER TABLE public.perfumes ADD CONSTRAINT perfumes_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
