-- Delete all blog posts except the recently created example ones
DELETE FROM public.blog_posts 
WHERE title NOT IN (
  'Welcome to Our Church Community',
  'The Power of Prayer in Daily Life',
  'Serving Others: The Heart of Christian Living',
  'Building Strong Families in Faith',
  'Finding Hope in Difficult Times'
);