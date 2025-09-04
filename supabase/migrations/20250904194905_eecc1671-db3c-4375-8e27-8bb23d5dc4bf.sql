-- Remove duplicate events by keeping only the earliest created record for each title, date, location combination
WITH duplicates AS (
  SELECT 
    id,
    title,
    date,
    location,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)), date, LOWER(TRIM(location)) 
      ORDER BY created_at ASC
    ) as row_num
  FROM events
)
DELETE FROM events 
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);