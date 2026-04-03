-- Add super admin role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Admin now includes super_admin privileges in existing policies/helpers
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- Avoid privilege escalation during signup: every new account starts as conductor.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'conductor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace profile policies with hardened role controls
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_admin(auth.uid())
);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role = 'conductor'
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.is_super_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND role = 'conductor')
)
WITH CHECK (
  (
    auth.uid() = user_id
    AND role = (
      SELECT p.role
      FROM public.profiles p
      WHERE p.user_id = auth.uid()
      LIMIT 1
    )
  )
  OR public.is_super_admin(auth.uid())
  OR (public.is_admin(auth.uid()) AND role = 'conductor')
);

-- Helper to promote/demote users by email (for bootstrap and operations)
CREATE OR REPLACE FUNCTION public.set_user_role_by_email(_email TEXT, _role public.app_role)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _profile public.profiles;
BEGIN
  -- SQL editor/bootstrap path: auth.uid() can be null.
  -- Runtime path: only super_admin can execute role changes.
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super_admin can modify roles';
  END IF;

  UPDATE public.profiles p
  SET role = _role
  WHERE LOWER(p.email) = LOWER(_email)
  RETURNING p.* INTO _profile;

  IF _profile.id IS NULL THEN
    RAISE EXCEPTION 'No profile found for email: %', _email;
  END IF;

  RETURN _profile;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role_by_email(TEXT, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_role_by_email(TEXT, public.app_role) TO authenticated;
