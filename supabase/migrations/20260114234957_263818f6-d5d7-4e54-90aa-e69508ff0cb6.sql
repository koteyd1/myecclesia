-- Update the MyEcclesia organization to be owned by the admin user
UPDATE public.organizations 
SET user_id = '7d5034d0-4fcc-4482-a0b3-fb9e6f4f5c61',
    updated_at = now()
WHERE id = '0352f8e7-9d6f-4199-be72-2b5b2bcdd487';