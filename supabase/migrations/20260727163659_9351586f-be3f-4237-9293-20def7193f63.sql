
CREATE TABLE public.hosting_plans_config (
  slug text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_inr numeric NOT NULL,
  billing_period text NOT NULL DEFAULT 'year',
  features text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hosting_plans_config TO anon, authenticated;
GRANT ALL ON public.hosting_plans_config TO service_role;
ALTER TABLE public.hosting_plans_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosting_plans_public_read" ON public.hosting_plans_config
  FOR SELECT USING (true);
CREATE POLICY "hosting_plans_admin_write" ON public.hosting_plans_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.hosting_plans_config (slug, name, description, price_inr, features, sort_order) VALUES
  ('basic', 'Basic hosting', 'Shared hosting, 10GB SSD, 1 website, free SSL. Ideal for 1–5 page sites.', 2499, ARRAY['10GB SSD storage','1 website','Free SSL','Free .in/.com email (1)'], 1),
  ('business', 'Business hosting', '20GB SSD, unlimited sites, free SSL & business email. Ideal for 10-page sites.', 4999, ARRAY['20GB SSD storage','Unlimited websites','Free SSL','5 business emails','Daily backups'], 2),
  ('premium', 'Premium hosting', '50GB SSD, priority support, staging site, daily backups.', 8999, ARRAY['50GB SSD storage','Unlimited websites','Free SSL','Unlimited business emails','Daily backups','Staging site','Priority support'], 3);
