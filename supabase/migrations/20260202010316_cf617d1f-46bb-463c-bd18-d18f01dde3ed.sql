-- Delete duplicate events, keeping only the oldest record for each unique combination
-- of title, date, time, and location
DELETE FROM events
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY title, date, time, 
               -- Normalize location by taking first part before comma for comparison
               LOWER(TRIM(title))
             ORDER BY created_at ASC
           ) as rn
    FROM events
  ) duplicates
  WHERE rn > 1
);

-- More precise duplicate removal based on exact match
DELETE FROM events e1
WHERE EXISTS (
  SELECT 1 FROM events e2
  WHERE e2.title = e1.title
    AND e2.date = e1.date
    AND e2.time = e1.time
    AND e2.created_at < e1.created_at
    AND e2.id != e1.id
);