
DROP POLICY IF EXISTS "Anyone signed in can read ratings" ON public.ratings;

CREATE POLICY "Owners and admins can read ratings"
ON public.ratings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
