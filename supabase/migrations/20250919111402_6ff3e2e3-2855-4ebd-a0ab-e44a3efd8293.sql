-- Promote koteyd1@outlook.com to admin
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = '7d5034d0-4fcc-4482-a0b3-fb9e6f4f5c61';