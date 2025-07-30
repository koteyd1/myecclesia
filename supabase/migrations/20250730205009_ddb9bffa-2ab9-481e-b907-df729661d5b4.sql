-- Remove duplicate events keeping only the earliest created for each title-date combination
WITH duplicates AS (
  SELECT 
    id,
    title,
    date,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)), date 
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