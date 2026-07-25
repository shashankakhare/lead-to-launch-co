
CREATE TABLE public.assignment_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_source TEXT NOT NULL,
  reason TEXT NOT NULL,
  candidate_count INTEGER,
  active_project_count INTEGER,
  workload_snapshot JSONB,
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignment_audit_order ON public.assignment_audit_log(order_id);
CREATE INDEX idx_assignment_audit_assigned_to ON public.assignment_audit_log(assigned_to);
CREATE INDEX idx_assignment_audit_created_at ON public.assignment_audit_log(created_at DESC);

GRANT SELECT ON public.assignment_audit_log TO authenticated;
GRANT ALL ON public.assignment_audit_log TO service_role;

ALTER TABLE public.assignment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all assignment audit entries"
  ON public.assignment_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Developers can view their own assignment audit entries"
  ON public.assignment_audit_log FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());
