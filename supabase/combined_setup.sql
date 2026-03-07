/*
  Idempotent setup script for Ripple Social database.
  Safe to run multiple times — uses IF NOT EXISTS and DROP IF EXISTS.
*/

-- Create custom types (safe: skip if already exists)
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE privacy_level AS ENUM ('public', 'private', 'recipient_only'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE poster_anonymity AS ENUM ('full_profile', 'first_name_only'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE recipient_type AS ENUM ('registered', 'anonymous'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('drivers_license', 'passport', 'national_id'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_request_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('tagged', 'like', 'comment', 'match_found', 'verification_complete'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text,
  display_name text,
  bio text,
  avatar_url text,
  verification_status verification_status DEFAULT 'pending',
  verification_submitted_at timestamptz,
  verified_at timestamptz,
  interests text[] DEFAULT '{}',
  notification_preferences jsonb DEFAULT '{"email_on_tag": true, "email_on_like": false, "email_on_comment": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  author_first_name text NOT NULL,
  content text NOT NULL,
  recipient_type recipient_type NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_name text NOT NULL,
  privacy_level privacy_level DEFAULT 'public',
  poster_anonymity poster_anonymity DEFAULT 'full_profile',
  recipient_visibility_override privacy_level,
  interests text[] DEFAULT '{}',
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  engagement_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  triggering_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Pending recipient matches table
CREATE TABLE IF NOT EXISTS pending_recipient_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text,
  matched boolean DEFAULT false,
  matched_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_url text NOT NULL,
  document_type document_type NOT NULL,
  status verification_request_status DEFAULT 'pending',
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_recipient_id ON posts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_engagement_score ON posts(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_pending_matches_matched ON pending_recipient_matches(matched, recipient_email);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_recipient_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop first to make idempotent, then recreate)

-- profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- posts policies
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
DROP POLICY IF EXISTS "Recipients can update visibility override" ON posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;

CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT TO authenticated
  USING (
    CASE
      WHEN recipient_visibility_override IS NOT NULL THEN
        CASE recipient_visibility_override
          WHEN 'public' THEN true
          WHEN 'recipient_only' THEN (auth.uid() = recipient_id OR auth.uid() = author_id)
          WHEN 'private' THEN (auth.uid() = recipient_id OR auth.uid() = author_id)
          ELSE false
        END
      ELSE
        CASE privacy_level
          WHEN 'public' THEN true
          WHEN 'recipient_only' THEN (auth.uid() = recipient_id OR auth.uid() = author_id)
          WHEN 'private' THEN (auth.uid() = author_id)
          ELSE false
        END
    END
  );
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id OR author_id IS NULL);
CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Recipients can update visibility override"
  ON posts FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- post_likes policies
DROP POLICY IF EXISTS "Users can view likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;

CREATE POLICY "Users can view likes"
  ON post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- comments policies
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Authors can update own comments" ON comments;
DROP POLICY IF EXISTS "Authors can delete own comments" ON comments;

CREATE POLICY "Users can view comments on visible posts"
  ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments"
  ON comments FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments"
  ON comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications for their posts" ON notifications;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create notifications for their posts"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid())
    OR EXISTS (SELECT 1 FROM posts WHERE id = post_id AND recipient_id = auth.uid())
  );

-- pending_recipient_matches policies
DROP POLICY IF EXISTS "Users can view matches related to them" ON pending_recipient_matches;
DROP POLICY IF EXISTS "System can create matches" ON pending_recipient_matches;
DROP POLICY IF EXISTS "System can update matches" ON pending_recipient_matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON pending_recipient_matches;

CREATE POLICY "Users can view matches related to them"
  ON pending_recipient_matches FOR SELECT TO authenticated
  USING (matched_user_id = auth.uid() OR matched = false);
CREATE POLICY "System can create matches"
  ON pending_recipient_matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own matches"
  ON pending_recipient_matches FOR UPDATE TO authenticated
  USING (matched = false OR matched_user_id = auth.uid())
  WITH CHECK (matched_user_id = auth.uid() OR matched_user_id IS NULL);

-- verification_requests policies
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can create own verification requests" ON verification_requests;

CREATE POLICY "Users can view own verification requests"
  ON verification_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own verification requests"
  ON verification_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- user_blocks policies
DROP POLICY IF EXISTS "Users can view own blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON user_blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON user_blocks;

CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- bookmarks policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Functions and Triggers (use CREATE OR REPLACE and DROP IF EXISTS for idempotency)

-- Engagement score
DROP TRIGGER IF EXISTS update_post_engagement_on_like ON post_likes;

CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  UPDATE posts SET engagement_score = (
    (like_count * 1.0) + (comment_count * 2.0) +
    (EXTRACT(EPOCH FROM (now() - created_at)) / 3600.0 * -0.1)
  ) WHERE id = target_post_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_engagement_on_like
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_engagement_score();

-- Like count
DROP TRIGGER IF EXISTS trigger_update_like_count ON post_likes;

CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- Comment count
DROP TRIGGER IF EXISTS trigger_update_comment_count ON comments;

CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Like notification
DROP TRIGGER IF EXISTS trigger_create_like_notification ON post_likes;

CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
BEGIN
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, post_id, triggering_user_id, message)
    VALUES (post_author_id, 'like', NEW.post_id, NEW.user_id, 'Someone liked your story');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_like_notification
  AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION create_like_notification();

-- Comment notification
DROP TRIGGER IF EXISTS trigger_create_comment_notification ON comments;

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id uuid;
BEGIN
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;
  IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, post_id, triggering_user_id, message)
    VALUES (post_author_id, 'comment', NEW.post_id, NEW.author_id, 'Someone commented on your story');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION create_comment_notification();

-- Updated_at timestamp
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_posts_updated_at ON posts;
DROP TRIGGER IF EXISTS trigger_comments_updated_at ON comments;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
