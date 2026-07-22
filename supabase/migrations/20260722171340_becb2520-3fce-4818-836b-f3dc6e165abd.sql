
-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weekly_capacity_hours int DEFAULT 40,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2);

-- Time entries
CREATE TABLE IF NOT EXISTS public.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  minutes int,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Developers manage own time entries" ON public.time_entries;
CREATE POLICY "Developers manage own time entries" ON public.time_entries
  FOR ALL TO authenticated
  USING (auth.uid() = developer_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = developer_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_time_entries_updated ON public.time_entries;
CREATE TRIGGER trg_time_entries_updated BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_time_entries_dev ON public.time_entries(developer_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_order ON public.time_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_started ON public.time_entries(started_at);
