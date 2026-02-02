-- Fix 1: Restrict profiles table to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Remove the insecure INSERT policy for user_roles
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create a secure function to assign roles during signup (called by trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  -- Get the role from user metadata (set during signup)
  requested_role := NEW.raw_user_meta_data->>'role';
  
  -- Only allow 'student' or 'alumni' roles, default to 'student'
  IF requested_role NOT IN ('student', 'alumni') THEN
    requested_role := 'student';
  END IF;
  
  -- Insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role::user_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();