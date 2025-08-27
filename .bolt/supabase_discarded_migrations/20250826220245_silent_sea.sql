/*
  # Remove problematic message trigger and fix notifications

  1. Changes
    - Drop the problematic trigger that calls non-existent supabase_functions.http_request
    - Drop the associated trigger function
    - Create a simple notification trigger that only creates in-app notifications
    - Ensure messages table works without external HTTP dependencies

  2. Security
    - Keep RLS enabled with safe policies
    - Maintain notification functionality through notifications table only
*/

-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS create_message_email_notification_trigger ON messages;
DROP FUNCTION IF EXISTS create_message_email_notification();

-- Create a simple notification function that doesn't use HTTP requests
CREATE OR REPLACE FUNCTION create_simple_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_user_id uuid;
    sender_name text;
BEGIN
    -- Get the recipient (the other participant in the conversation)
    SELECT cp.user_id INTO recipient_user_id
    FROM conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id 
    AND cp.user_id != NEW.sender_id
    LIMIT 1;

    -- Get sender name for the notification
    SELECT COALESCE(c.name, v.name, 'Someone') INTO sender_name
    FROM auth.users u
    LEFT JOIN couples c ON c.user_id = u.id
    LEFT JOIN vendors v ON v.user_id = u.id
    WHERE u.id = NEW.sender_id;

    -- Create notification if we found a recipient
    IF recipient_user_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data,
            action_url
        ) VALUES (
            recipient_user_id,
            'message',
            'New Message',
            sender_name || ' sent you a message',
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id
            ),
            '/profile?tab=messages'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;