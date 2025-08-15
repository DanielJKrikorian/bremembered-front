/*
  # Create chat messages table for chatbot

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (text, unique session identifier)
      - `sender_type` (text, 'user' or 'bot')
      - `message` (text, message content)
      - `lead_id` (uuid, optional reference to leads table)
      - `ip_address` (text, user's IP address)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for public read/write access (for anonymous chat)
    - Add policy for authenticated users to manage their messages

  3. Indexes
    - Index on session_id for fast lookups
    - Index on created_at for chronological ordering
    - Index on lead_id for lead association
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'bot', 'admin')),
  message text NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  ip_address text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lead_id ON chat_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public access for anonymous chat
CREATE POLICY "Allow public read access to chat messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert for chat messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated users to manage messages
CREATE POLICY "Allow authenticated users to manage chat messages"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();