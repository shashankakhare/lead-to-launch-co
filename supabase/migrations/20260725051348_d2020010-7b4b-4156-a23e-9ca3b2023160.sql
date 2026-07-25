DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'revision_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.revision_status AS ENUM ('pending', 'addressed', 'approved');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.revision_status NOT NULL DEFAULT 'pending',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revisions TO authenticated;
GRANT ALL ON public.revisions TO service_role;

ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can request revisions on their orders" ON public.revisions;
CREATE POLICY "Clients can request revisions on their orders" ON public.revisions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'developer')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Revisions visible to order participants" ON public.revisions;
CREATE POLICY "Revisions visible to order participants" ON public.revisions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'developer')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can approve revisions" ON public.revisions;
CREATE POLICY "Clients can approve revisions" ON public.revisions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'developer')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'developer')
    OR EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS trg_revisions_updated ON public.revisions;
CREATE TRIGGER trg_revisions_updated BEFORE UPDATE ON public.revisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_revisions_order ON public.revisions(order_id);
CREATE INDEX IF NOT EXISTS idx_revisions_status ON public.revisions(status);