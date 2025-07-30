-- Remove duplicate events where title, description, date, and time are identical
WITH duplicates AS (
  SELECT 
    id,
    title,
    description,
    date,
    time,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)), LOWER(TRIM(COALESCE(description, ''))), date, time
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