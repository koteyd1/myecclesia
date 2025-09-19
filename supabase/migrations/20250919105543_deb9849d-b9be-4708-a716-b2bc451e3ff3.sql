-- Give admin role to your primary account
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = '4fc77662-75ce-4eb6-9518-d662a0ca3d95';

-- If no role exists, insert it
INSERT INTO public.user_roles (user_id, role)
SELECT '4fc77662-75ce-4eb6-9518-d662a0ca3d95', 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '4fc77662-75ce-4eb6-9518-d662a0ca3d95'
);