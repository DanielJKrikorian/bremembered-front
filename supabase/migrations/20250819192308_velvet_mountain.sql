/*
  # Create blog_subscriptions table

  1. New Tables
    - `blog_subscriptions`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `name` (text, optional)
      - `status` (text, default 'subscribed')
      - `subscription_source` (text, default 'website')
      - `subscribed_at` (timestamp, default now)
      - `unsubscribed_at` (timestamp, nullable)
      - `preferences` (jsonb, default empty object)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on `blog_subscriptions` table
    - Add policy for public to insert subscriptions
    - Add policy for authenticated users to read their own subscriptions
*/

CREATE TABLE IF NOT EXISTS blog_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  status text DEFAULT 'subscribed' NOT NULL,
  subscription_source text DEFAULT 'website' NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  preferences jsonb DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE blog_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert new subscriptions
CREATE POLICY "Allow public to insert blog subscriptions"
  ON blog_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to read their own subscriptions
CREATE POLICY "Users can read their own blog subscriptions"
  ON blog_subscriptions
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow users to update their own subscriptions (for unsubscribing)
CREATE POLICY "Users can update their own blog subscriptions"
  ON blog_subscriptions
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add constraint to ensure valid status values
ALTER TABLE blog_subscriptions 
ADD CONSTRAINT valid_subscription_status 
CHECK (status IN ('subscribed', 'unsubscribed'));

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_email ON blog_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_status ON blog_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_source ON blog_subscriptions(subscription_source);