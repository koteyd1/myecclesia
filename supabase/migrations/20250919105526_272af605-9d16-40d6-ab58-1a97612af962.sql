-- Create a new admin user profile and role
-- First insert a profile (this will represent a new admin user)
INSERT INTO public.profiles (user_id, email, full_name)
VALUES (gen_random_uuid(), 'admin@myecclesia.co.uk', 'System Administrator');

-- Get the user_id we just created
WITH new_admin AS (
  SELECT user_id FROM public.profiles WHERE email = 'admin@myecclesia.co.uk'
)
-- Insert admin role for this user
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role 
FROM new_admin;