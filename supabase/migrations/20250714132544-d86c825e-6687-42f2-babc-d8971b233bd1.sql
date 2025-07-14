-- Update events with real UK city locations

UPDATE events 
SET location = 'St. Paul''s Cathedral, London'
WHERE title = 'Sunday Worship Service';

UPDATE events 
SET location = 'Youth Community Centre, Manchester'
WHERE title = 'Youth Group Meeting';

UPDATE events 
SET location = 'City Hall, Birmingham'
WHERE title = 'Community Outreach Dinner';

UPDATE events 
SET location = 'Edinburgh Castle Conference Centre, Edinburgh'
WHERE title = 'Bible Study Workshop';

UPDATE events 
SET location = 'Westminster Abbey, London'
WHERE title = 'Easter Celebration Service';

UPDATE events 
SET location = 'Welsh National Opera House, Cardiff'
WHERE title = 'Marriage Enrichment Retreat';

-- Add more sample events with UK locations
INSERT INTO events (title, description, date, time, location, image, price, available_tickets, category, organizer, duration, requirements, denominations, ticket_url)
VALUES 
('Christmas Carol Service', 'Join us for traditional Christmas carols and festive celebrations with the community.', '2024-12-24', '19:00:00', 'York Minster, York', 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&h=400&fit=crop', 0.00, 300, 'Special Events', 'Rev. Sarah Thompson', '2 hours', 'None - All ages welcome', 'All Welcome', 'https://eventbrite.com/christmas-carols'),

('Prayer Walk', 'A peaceful prayer walk through the historic streets and beautiful countryside.', '2024-06-15', '10:00:00', 'Canterbury Cathedral, Canterbury', 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=400&fit=crop', 0.00, 50, 'Prayer Meeting', 'Fr. Michael Davies', '1.5 hours', 'Comfortable walking shoes recommended', 'Anglican', 'https://eventbrite.com/prayer-walk'),

('Family Fun Day', 'Games, activities, and fellowship for the whole family in a beautiful setting.', '2024-07-20', '11:00:00', 'Stonehenge Visitor Centre, Salisbury', 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=400&fit=crop', 5.00, 150, 'Family Events', 'Children''s Ministry Team', '4 hours', 'Children must be accompanied by adults', 'Non-denominational', 'https://eventbrite.com/family-fun-day'),

('Healing Service', 'A special service focused on prayer for healing and spiritual renewal.', '2024-05-10', '18:30:00', 'Bath Abbey, Bath', 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop', 0.00, 100, 'Special Events', 'Pastor James Wilson', '1 hour', 'Open to all denominations', 'Interfaith', 'https://eventbrite.com/healing-service'),

('Charity Concert', 'An evening of music and worship to raise funds for local homeless shelter.', '2024-08-25', '19:30:00', 'Royal Albert Hall, London', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop', 15.00, 200, 'Fundraising', 'Music Ministry', '2.5 hours', 'Smart casual dress code', 'All Welcome', 'https://eventbrite.com/charity-concert'),

('Alpha Course', 'An introduction to Christianity in a relaxed and friendly environment.', '2024-09-05', '19:00:00', 'Liverpool Cathedral, Liverpool', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop', 0.00, 30, 'Educational', 'Alpha Team', '10 weeks', 'No prior knowledge required', 'All Welcome', 'https://eventbrite.com/alpha-course'),

('Men''s Breakfast', 'Monthly breakfast meeting for men with inspiring talks and fellowship.', '2024-06-01', '08:00:00', 'Glasgow Cathedral, Glasgow', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop', 8.00, 40, 'Fellowship', 'Men''s Ministry', '2 hours', 'Men only', 'Presbyterian', 'https://eventbrite.com/mens-breakfast'),

('Women''s Conference', 'Inspiring talks, workshops, and fellowship for women of all ages.', '2024-10-12', '09:00:00', 'Durham Cathedral, Durham', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=400&fit=crop', 25.00, 80, 'Conferences', 'Women''s Ministry Team', '6 hours', 'Women only - includes lunch', 'Methodist', 'https://eventbrite.com/womens-conference'),

('Teen Night', 'Fun evening for teenagers with games, music, and inspiring messages.', '2024-07-05', '18:00:00', 'Chester Cathedral, Chester', 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&h=400&fit=crop', 3.00, 60, 'Youth Events', 'Youth Pastor Emma', '3 hours', 'Ages 13-19 only', 'Baptist', 'https://eventbrite.com/teen-night'),

('Outdoor Service', 'Special outdoor worship service in beautiful natural surroundings.', '2024-08-15', '10:00:00', 'Tintern Abbey, Monmouthshire', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', 0.00, 120, 'Worship Service', 'Rev. David Morgan', '1.5 hours', 'Weather dependent - bring blankets', 'All Welcome', 'https://eventbrite.com/outdoor-service');