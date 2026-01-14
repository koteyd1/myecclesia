-- Update blog post content to replace old domain references
UPDATE blog_posts 
SET content = REPLACE(content, 'myecclesia.co.uk', 'myecclesia.org.uk'),
    updated_at = now()
WHERE content LIKE '%myecclesia.co.uk%';

-- Also update any references to myecclesia.uk (without subdomain prefix)
UPDATE blog_posts 
SET content = REPLACE(content, 'myecclesia.uk', 'myecclesia.org.uk'),
    updated_at = now()
WHERE content LIKE '%myecclesia.uk%' 
  AND content NOT LIKE '%myecclesia.org.uk%';