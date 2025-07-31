-- ✅ Enable RLS on the table (if not already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ✅ Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- ✅ Create updated SELECT policy to support pre-registered users
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id OR user_id IS NULL
);

-- ✅ Drop existing INSERT policy
DROP POLICY IF EXISTS "Clients can assign employee roles in their organization" ON public.user_roles;

-- ✅ Create updated INSERT policy to explicitly handle current user context
CREATE POLICY "Clients can assign employee roles in their organization"
ON public.user_roles
FOR INSERT
WITH CHECK (
  (
    has_role(auth.uid(), 'client'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
  AND role = 'employee'::app_role
  AND organization_id IN (
    SELECT organization_id FROM profiles WHERE user_id = auth.uid()
  )
);