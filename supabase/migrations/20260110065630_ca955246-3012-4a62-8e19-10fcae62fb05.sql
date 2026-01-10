-- Allow all authenticated users to view all roles (needed for directory filtering)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Authenticated users can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);