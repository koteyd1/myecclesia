-- Create a cron job to automatically cleanup old events
-- This will run daily at midnight to delete events 2+ days past their date
SELECT cron.schedule(
  'cleanup-old-events',
  '0 0 * * *', -- Run daily at midnight
  $$
  SELECT
    net.http_post(
        url:='https://imwastdmyeaaslurcovw.supabase.co/functions/v1/cleanup-old-events',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imltd2FzdGRteWVhYXNsdXJjb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNzU3OTgsImV4cCI6MjA2Nzg1MTc5OH0.gRSeBYlLxOPXi1W210LEk7UgGnCqY0ZXKZwSoiREuJA"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);