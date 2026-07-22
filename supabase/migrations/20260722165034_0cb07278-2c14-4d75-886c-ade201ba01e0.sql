
-- add developer role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- add order admin fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- site_content
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content_public_read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "site_content_admin_write" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- packages_config
CREATE TABLE IF NOT EXISTS public.packages_config (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pages TEXT NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  features TEXT[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  cta_text TEXT NOT NULL DEFAULT 'Get started',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages_config TO anon, authenticated;
GRANT ALL ON public.packages_config TO service_role;
ALTER TABLE public.packages_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_config_public_read" ON public.packages_config FOR SELECT USING (true);
CREATE POLICY "packages_config_admin_write" ON public.packages_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- addons_config
CREATE TABLE IF NOT EXISTS public.addons_config (
  kind TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_usd NUMERIC(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.addons_config TO anon, authenticated;
GRANT ALL ON public.addons_config TO service_role;
ALTER TABLE public.addons_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addons_config_public_read" ON public.addons_config FOR SELECT USING (true);
CREATE POLICY "addons_config_admin_write" ON public.addons_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE TRIGGER trg_site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_packages_config_updated_at BEFORE UPDATE ON public.packages_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_addons_config_updated_at BEFORE UPDATE ON public.addons_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed packages from current defaults
INSERT INTO public.packages_config (slug, name, pages, price_usd, tagline, features, sort_order, cta_text) VALUES
  ('one_page', 'Starter', '1 page', 299, 'Perfect landing page',
    ARRAY['1-page WordPress site','Custom design','Mobile responsive','Contact form','Basic SEO','Live in 4 days'], 1, 'Get started'),
  ('five_page', 'Business', '5 pages', 799, 'Most popular',
    ARRAY['5-page WordPress site','Custom design','Mobile responsive','Contact & inquiry forms','On-page SEO','Google Analytics','Full source handover'], 2, 'Get started'),
  ('ten_page', 'Portfolio+', '10 pages', 1499, 'For agencies & studios',
    ARRAY['10-page WordPress site','Premium custom design','Portfolio / services modules','Blog setup','Advanced SEO','Speed optimization','30-day support'], 3, 'Get started')
ON CONFLICT (slug) DO NOTHING;

-- seed addons
INSERT INTO public.addons_config (kind, title, description, price_usd) VALUES
  ('extra_page', 'Extra page', 'Add one more designed & developed page to your site.', 99),
  ('extra_revision', 'Extra revision round', 'One additional round of design/content revisions.', 49),
  ('rush', 'Rush 2-day delivery', 'Fast-track your build to 2 days instead of 4.', 199)
ON CONFLICT (kind) DO NOTHING;

-- seed default site content sections (empty = use hardcoded defaults)
INSERT INTO public.site_content (key, value) VALUES
  ('hero', '{}'::jsonb),
  ('process', '{}'::jsonb),
  ('faq', '{}'::jsonb),
  ('footer', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
