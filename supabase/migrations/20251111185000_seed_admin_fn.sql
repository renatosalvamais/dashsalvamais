-- Create a security definer function to seed the first admin by email
CREATE OR REPLACE FUNCTION public.seed_admin_by_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  admin_count INTEGER;
  target_user_id UUID;
BEGIN
  -- If an admin already exists, do nothing
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count > 0 THEN
    RETURN FALSE;
  END IF;

  -- Find user id by email in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = _email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _email;
  END IF;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_admin_by_email(TEXT) TO anon, authenticated;