-- Promote the first user (David k) to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('4fc77662-75ce-4eb6-9518-d662a0ca3d95', 'admin'::app_role)
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin'::app_role;