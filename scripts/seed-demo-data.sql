-- Demo seed data for Ripple social media platform
-- This script creates sample users and posts for testing

-- Note: In a real application, users would be created through Supabase Auth
-- For demo purposes, we'll create sample profile data assuming auth users exist

-- Sample posts with various privacy levels and scenarios
INSERT INTO posts (
  author_id,
  author_first_name,
  content,
  recipient_type,
  recipient_id,
  recipient_name,
  privacy_level,
  poster_anonymity,
  interests,
  like_count,
  comment_count,
  engagement_score,
  created_at
) VALUES
  (
    NULL,
    'Sarah',
    'I witnessed an incredible act of kindness today. A stranger helped an elderly woman carry her groceries all the way to her apartment, even though it was raining. He didn''t ask for anything in return, just smiled and said "have a great day." We need more people like this in the world.',
    'anonymous',
    NULL,
    'The kind stranger at Whole Foods',
    'public',
    'first_name_only',
    ARRAY['kindness', 'community'],
    12,
    3,
    15.2,
    NOW() - INTERVAL '2 hours'
  ),
  (
    NULL,
    'Michael',
    'My teacher Mrs. Rodriguez stayed after school for months to help me understand math. Because of her patience and dedication, I not only passed but actually started to love the subject. She saw potential in me when I couldn''t see it in myself. Thank you for changing my life.',
    'anonymous',
    NULL,
    'Mrs. Rodriguez',
    'public',
    'full_profile',
    ARRAY['education', 'mentorship', 'gratitude'],
    28,
    5,
    42.8,
    NOW() - INTERVAL '5 hours'
  ),
  (
    NULL,
    'Emma',
    'During the worst time of my life, when I lost my job and was struggling, my neighbor started leaving groceries at my door with anonymous notes of encouragement. It took me weeks to figure out it was them. That kindness gave me hope when I had none.',
    'anonymous',
    NULL,
    'My neighbor on Oak Street',
    'public',
    'first_name_only',
    ARRAY['kindness', 'support', 'community'],
    45,
    8,
    68.5,
    NOW() - INTERVAL '1 day'
  ),
  (
    NULL,
    'David',
    'My sister has been my rock through everything. When I came out to my family, she was the first one to hug me and tell me nothing had changed. She''s defended me, supported me, and shown me what unconditional love really means.',
    'anonymous',
    NULL,
    'Jessica Chen',
    'public',
    'full_profile',
    ARRAY['family', 'support', 'love'],
    67,
    12,
    98.4,
    NOW() - INTERVAL '2 days'
  ),
  (
    NULL,
    'Rachel',
    'A complete stranger paid for my coffee today when my card was declined. Such a small gesture, but it completely turned my day around. In that moment, I felt seen and cared for by someone who owed me nothing.',
    'anonymous',
    NULL,
    'Coffee shop stranger',
    'public',
    'first_name_only',
    ARRAY['kindness', 'pay-it-forward'],
    19,
    4,
    26.3,
    NOW() - INTERVAL '6 hours'
  ),
  (
    NULL,
    'James',
    'My coach believed in me when no one else did. He saw past my mistakes and focused on my potential. Because of his guidance and faith in me, I earned a scholarship and became the first person in my family to go to college.',
    'anonymous',
    NULL,
    'Coach Martinez',
    'public',
    'full_profile',
    ARRAY['mentorship', 'sports', 'education'],
    89,
    15,
    132.7,
    NOW() - INTERVAL '3 days'
  ),
  (
    NULL,
    'Lisa',
    'My best friend dropped everything to drive 6 hours when I called her crying at 2 AM. She didn''t ask questions, she just came. That''s the kind of friendship that defines what it means to be there for someone.',
    'anonymous',
    NULL,
    'Amanda',
    'public',
    'first_name_only',
    ARRAY['friendship', 'support'],
    52,
    9,
    76.8,
    NOW() - INTERVAL '12 hours'
  ),
  (
    NULL,
    'Tom',
    'I saw a firefighter comfort a child who was scared during an evacuation. He took off his helmet, sat down at the kid''s level, and talked to him about fire trucks until he was calm and smiling. Heroes aren''t just brave, they''re kind.',
    'anonymous',
    NULL,
    'Firefighter Station 12',
    'public',
    'full_profile',
    ARRAY['heroes', 'kindness', 'community'],
    34,
    6,
    48.2,
    NOW() - INTERVAL '8 hours'
  );

-- Create some sample notifications
-- Note: These would normally be created through triggers when actions occur
-- For demo purposes, we can add a few examples

-- Sample pending recipient matches for the anonymous posts
INSERT INTO pending_recipient_matches (
  post_id,
  recipient_name,
  recipient_email,
  matched,
  created_at
)
SELECT
  id,
  recipient_name,
  NULL,
  false,
  created_at
FROM posts
WHERE recipient_type = 'anonymous'
LIMIT 5;
