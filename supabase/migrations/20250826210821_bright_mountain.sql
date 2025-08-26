/*
  # Create notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification content)
      - `data` (jsonb, additional data)
      - `read` (boolean, read status)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, optional)
      - `action_url` (text, optional)
      - `priority` (text, priority level)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to manage their own notifications

  3. Functions
    - `mark_notification_read` function
    - `mark_all_notifications_read` function
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_message', 'photo_upload', 'payment_due', 'review_response', 'booking_update', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  action_url text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Function to mark a single notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET read = true, updated_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET read = true, updated_at = now()
  WHERE user_id = auth.uid() AND read = false;
END;
$$;

-- Function to create notification (for use by triggers and edge functions)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}',
  p_action_url text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    action_url,
    priority,
    expires_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_data,
    p_action_url,
    p_priority,
    p_expires_at
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function to create notification when new message is inserted
CREATE OR REPLACE FUNCTION notify_message_recipient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
  sender_type text;
BEGIN
  -- Find the recipient (participant who is not the sender)
  SELECT unnest(participant_ids) INTO recipient_id
  FROM conversations 
  WHERE id = NEW.conversation_id 
    AND unnest(participant_ids) != NEW.sender_id
  LIMIT 1;
  
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get sender information
  SELECT COALESCE(v.name, c.name, 'Unknown User'), 
         CASE WHEN v.id IS NOT NULL THEN 'vendor' ELSE 'couple' END
  INTO sender_name, sender_type
  FROM auth.users u
  LEFT JOIN vendors v ON v.user_id = u.id
  LEFT JOIN couples c ON c.user_id = u.id
  WHERE u.id = NEW.sender_id;
  
  -- Create notification for recipient
  PERFORM create_notification(
    recipient_id,
    'new_message',
    'New message from ' || COALESCE(sender_name, 'Unknown User'),
    NEW.message_text,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', sender_name,
      'sender_type', sender_type
    ),
    '/profile?tab=messages',
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS trigger_notify_message_recipient ON messages;
CREATE TRIGGER trigger_notify_message_recipient
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_recipient();

-- Trigger function to create notification when photos are uploaded
CREATE OR REPLACE FUNCTION notify_photo_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_name text;
BEGIN
  -- Only notify for photo uploads (not other file types)
  IF NEW.file_name !~* '\.(jpg|jpeg|png|gif|webp)$' THEN
    RETURN NEW;
  END IF;
  
  -- Get vendor name
  SELECT name INTO vendor_name
  FROM vendors 
  WHERE id = NEW.vendor_id;
  
  -- Get couple's user_id and create notification
  PERFORM create_notification(
    (SELECT user_id FROM couples WHERE id = NEW.couple_id),
    'photo_upload',
    'New photos uploaded by ' || COALESCE(vendor_name, 'your vendor'),
    'Your ' || COALESCE(vendor_name, 'vendor') || ' has uploaded new photos to your gallery',
    jsonb_build_object(
      'vendor_id', NEW.vendor_id,
      'vendor_name', vendor_name,
      'file_name', NEW.file_name,
      'file_path', NEW.file_path
    ),
    '/profile?tab=gallery',
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on file_uploads table
DROP TRIGGER IF EXISTS trigger_notify_photo_upload ON file_uploads;
CREATE TRIGGER trigger_notify_photo_upload
  AFTER INSERT ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION notify_photo_upload();

-- Trigger function to create notification when vendor responds to review
CREATE OR REPLACE FUNCTION notify_review_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_name text;
BEGIN
  -- Only notify if vendor_response was added (not on initial review creation)
  IF OLD.vendor_response IS NOT NULL OR NEW.vendor_response IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get vendor name
  SELECT name INTO vendor_name
  FROM vendors 
  WHERE id = NEW.vendor_id;
  
  -- Get couple's user_id and create notification
  PERFORM create_notification(
    (SELECT user_id FROM couples WHERE id = NEW.couple_id),
    'review_response',
    COALESCE(vendor_name, 'Your vendor') || ' responded to your review',
    'Your vendor has responded to the review you left for them',
    jsonb_build_object(
      'vendor_id', NEW.vendor_id,
      'vendor_name', vendor_name,
      'review_id', NEW.id
    ),
    '/profile?tab=reviews',
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on vendor_reviews table
DROP TRIGGER IF EXISTS trigger_notify_review_response ON vendor_reviews;
CREATE TRIGGER trigger_notify_review_response
  AFTER UPDATE ON vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_review_response();