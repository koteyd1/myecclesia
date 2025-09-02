-- Delete specific blog posts by title
DELETE FROM blog_posts 
WHERE title IN (
  'Finding Hope in Difficult Times',
  'The Power of Community Service',
  'Youth Ministry',
  'Building Strong Family Foundations'
);