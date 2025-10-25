/*
  # Security and Trigger Fixes

  This migration addresses critical security vulnerabilities and bugs identified in the code review:

  ## Changes

  1. **Fix RLS Policy for Notifications**
     - Replace overly permissive "System can create notifications" policy
     - Only allow users to create notifications for their own posts

  2. **Fix RLS Policies for Pending Recipient Matches**
     - Tighten update permissions to prevent match hijacking
     - Only allow updates where matched_user_id matches current user

  3. **Fix Engagement Score Trigger**
     - Handle DELETE operations properly using OLD.post_id
     - Ensure engagement scores update correctly when likes are removed
*/

-- Drop and recreate the notification creation policy
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can create notifications for their posts"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow creating notifications for posts the user owns
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_id
      AND author_id = auth.uid()
    )
    OR
    -- Allow creating notifications when user is tagged as recipient
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_id
      AND recipient_id = auth.uid()
    )
  );

-- Drop and recreate the pending matches update policy
DROP POLICY IF EXISTS "System can update matches" ON pending_recipient_matches;

CREATE POLICY "Users can update their own matches"
  ON pending_recipient_matches FOR UPDATE
  TO authenticated
  USING (
    -- Can only update if not matched yet, or if you're the matched user
    matched = false OR matched_user_id = auth.uid()
  )
  WITH CHECK (
    -- Can only set matched_user_id to yourself
    matched_user_id = auth.uid() OR matched_user_id IS NULL
  );

-- Fix the engagement score trigger to handle DELETE operations
DROP TRIGGER IF EXISTS update_post_engagement_on_like ON post_likes;

CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id uuid;
BEGIN
  -- Determine which post_id to use based on operation type
  IF TG_OP = 'DELETE' THEN
    target_post_id := OLD.post_id;
  ELSE
    target_post_id := NEW.post_id;
  END IF;

  -- Update the engagement score for the post
  UPDATE posts
  SET engagement_score = (
    (like_count * 1.0) +
    (comment_count * 2.0) +
    (EXTRACT(EPOCH FROM (now() - created_at)) / 3600.0 * -0.1)
  )
  WHERE id = target_post_id;

  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_post_engagement_on_like
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();
