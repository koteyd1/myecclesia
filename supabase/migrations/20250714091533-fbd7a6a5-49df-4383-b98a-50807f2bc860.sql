-- Create a sample registration with "registered" status
INSERT INTO public.event_registrations (user_id, event_id, status) 
VALUES (
  (SELECT user_id FROM user_roles LIMIT 1), 
  (SELECT id FROM events LIMIT 1), 
  'registered'
);