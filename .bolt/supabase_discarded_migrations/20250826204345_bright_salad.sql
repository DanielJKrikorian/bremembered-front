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
      - `expires_at` (timestamp, optional expiration)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for system to create notifications

  3. Functions
    - Function to mark notifications as read
    - Function to create payment due notifications
    - Function to create message notifications
    - Function to create photo upload notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  action_url text DEFAULT NULL,
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
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Function to mark notifications as read
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

-- Function to create message notifications
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipient_user_id uuid;
  sender_name text;
  conversation_participants uuid[];
BEGIN
  -- Get conversation participants
  SELECT participant_ids INTO conversation_participants
  FROM conversations 
  WHERE id = NEW.conversation_id;
  
  -- Find recipient (not the sender)
  SELECT unnest(conversation_participants) INTO recipient_user_id
  WHERE unnest(conversation_participants) != NEW.sender_id
  LIMIT 1;
  
  IF recipient_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get sender name
  SELECT COALESCE(v.name, c.name, u.raw_user_meta_data->>'name', 'Someone')
  INTO sender_name
  FROM auth.users u
  LEFT JOIN vendors v ON v.user_id = u.id
  LEFT JOIN couples c ON c.user_id = u.id
  WHERE u.id = NEW.sender_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    action_url,
    priority
  ) VALUES (
    recipient_user_id,
    'new_message',
    'New message from ' || sender_name,
    LEFT(NEW.message_text, 100) || CASE WHEN LENGTH(NEW.message_text) > 100 THEN '...' ELSE '' END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', sender_name,
      'message_id', NEW.id
    ),
    '/profile?tab=messages',
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Function to create photo upload notifications
CREATE OR REPLACE FUNCTION create_photo_upload_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  couple_user_id uuid;
  vendor_name text;
BEGIN
  -- Get couple's user_id
  SELECT user_id INTO couple_user_id
  FROM couples 
  WHERE id = NEW.couple_id;
  
  IF couple_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get vendor name
  SELECT name INTO vendor_name
  FROM vendors 
  WHERE id = NEW.vendor_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    action_url,
    priority
  ) VALUES (
    couple_user_id,
    'photo_upload',
    'New photos from ' || COALESCE(vendor_name, 'your vendor'),
    'Your vendor has uploaded new photos to your wedding gallery',
    jsonb_build_object(
      'vendor_id', NEW.vendor_id,
      'vendor_name', vendor_name,
      'file_id', NEW.id,
      'file_name', NEW.file_name
    ),
    '/profile?tab=gallery',
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Function to create payment due notifications
CREATE OR REPLACE FUNCTION create_payment_due_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
  couple_user_id uuid;
  vendor_name text;
  remaining_balance integer;
  event_date date;
  days_until_event integer;
BEGIN
  -- Find bookings with events 7 days away that have remaining balance
  FOR booking_record IN
    SELECT b.id, b.couple_id, b.vendor_id, b.amount, b.paid_amount, 
           b.service_type, e.start_time::date as event_date,
           sp.name as package_name
    FROM bookings b
    JOIN events e ON e.id = b.event_id
    LEFT JOIN service_packages sp ON sp.id = b.package_id
    WHERE e.start_time::date = CURRENT_DATE + INTERVAL '7 days'
      AND (b.amount - COALESCE(b.paid_amount, 0)) > 0
      AND b.status IN ('confirmed', 'pending')
  LOOP
    -- Calculate remaining balance
    remaining_balance := booking_record.amount - COALESCE(booking_record.paid_amount, 0);
    
    -- Get couple's user_id
    SELECT user_id INTO couple_user_id
    FROM couples 
    WHERE id = booking_record.couple_id;
    
    -- Get vendor name
    SELECT name INTO vendor_name
    FROM vendors 
    WHERE id = booking_record.vendor_id;
    
    -- Check if notification already exists for this booking
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = couple_user_id 
        AND type = 'payment_due'
        AND data->>'booking_id' = booking_record.id::text
        AND created_at > CURRENT_DATE
    ) THEN
      -- Create payment due notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        action_url,
        priority
      ) VALUES (
        couple_user_id,
        'payment_due',
        'Payment due in 7 days',
        'Your remaining balance of $' || (remaining_balance / 100)::text || ' for ' || 
        COALESCE(booking_record.package_name, booking_record.service_type) || ' is due in 7 days',
        jsonb_build_object(
          'booking_id', booking_record.id,
          'vendor_id', booking_record.vendor_id,
          'vendor_name', vendor_name,
          'amount_due', remaining_balance,
          'event_date', booking_record.event_date,
          'service_type', booking_record.service_type
        ),
        '/profile?tab=payments',
        'high'
      );
    END IF;
  END LOOP;
END;
$$;

-- Function to create vendor review response notifications
CREATE OR REPLACE FUNCTION create_review_response_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  couple_user_id uuid;
  vendor_name text;
BEGIN
  -- Only trigger when vendor_response is added (not on initial review creation)
  IF OLD.vendor_response IS NOT NULL OR NEW.vendor_response IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get couple's user_id
  SELECT user_id INTO couple_user_id
  FROM couples 
  WHERE id = NEW.couple_id;
  
  IF couple_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get vendor name
  SELECT name INTO vendor_name
  FROM vendors 
  WHERE id = NEW.vendor_id;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    action_url,
    priority
  ) VALUES (
    couple_user_id,
    'review_response',
    COALESCE(vendor_name, 'Your vendor') || ' responded to your review',
    'Your vendor has responded to the review you left for them',
    jsonb_build_object(
      'vendor_id', NEW.vendor_id,
      'vendor_name', vendor_name,
      'review_id', NEW.id,
      'response', LEFT(NEW.vendor_response, 100)
    ),
    '/profile?tab=reviews',
    'normal'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

DROP TRIGGER IF EXISTS photo_upload_notification_trigger ON file_uploads;
CREATE TRIGGER photo_upload_notification_trigger
  AFTER INSERT ON file_uploads
  FOR EACH ROW
  EXECUTE FUNCTION create_photo_upload_notification();

DROP TRIGGER IF EXISTS review_response_notification_trigger ON vendor_reviews;
CREATE TRIGGER review_response_notification_trigger
  AFTER UPDATE ON vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_review_response_notification();

-- Create a scheduled function to check for payment due notifications daily
-- This would typically be set up as a cron job or scheduled function
-- For now, we'll create the function that can be called manually or via cron
CREATE OR REPLACE FUNCTION check_payment_due_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_payment_due_notifications();
END;
$$;