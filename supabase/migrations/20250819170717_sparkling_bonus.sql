/*
  # Create blog subscriptions table

  1. New Tables
    - `blog_subscriptions`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text, optional)
      - `status` (text, active/unsubscribed)
      - `subscribed_at` (timestamp)
      - `unsubscribed_at` (timestamp, optional)
      - `subscription_source` (text, tracks where they signed up)
      - `preferences` (jsonb, for future customization)

  2. Security
    - Enable RLS on `blog_subscriptions` table
    - Add policy for public inserts (newsletter signups)
    - Add policy for users to manage their own subscriptions

  3. Indexes
    - Index on email for fast lookups
    - Index on status for filtering active subscribers
*/

CREATE TABLE IF NOT EXISTS blog_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  subscription_source text DEFAULT 'website',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blog_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to subscribe
CREATE POLICY "Anyone can subscribe to blog"
  ON blog_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON blog_subscriptions
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow users to update their own subscription (unsubscribe)
CREATE POLICY "Users can update their own subscription"
  ON blog_subscriptions
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_email ON blog_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_status ON blog_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_source ON blog_subscriptions(subscription_source);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_subscriptions_updated_at
  BEFORE UPDATE ON blog_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_subscriptions_updated_at();