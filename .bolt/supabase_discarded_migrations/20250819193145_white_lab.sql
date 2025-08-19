/*
  # Update blog subscriptions status to use 'active'

  1. Changes
    - Change default status from 'subscribed' to 'active'
    - Update status enum to use 'active' instead of 'subscribed'
    - Update existing records to use 'active' status

  2. Security
    - Maintains existing RLS policies
*/

-- Update the status enum to use 'active' instead of 'subscribed'
ALTER TYPE subscription_status RENAME TO subscription_status_old;
CREATE TYPE subscription_status AS ENUM ('active', 'unsubscribed');

-- Update the table to use the new enum and set default to 'active'
ALTER TABLE blog_subscriptions 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE subscription_status USING 
    CASE 
      WHEN status::text = 'subscribed' THEN 'active'::subscription_status
      ELSE status::text::subscription_status
    END,
  ALTER COLUMN status SET DEFAULT 'active';

-- Drop the old enum type
DROP TYPE subscription_status_old;

-- Update any existing 'subscribed' records to 'active'
UPDATE blog_subscriptions 
SET status = 'active' 
WHERE status::text = 'subscribed';