/*
  # Create chat messages table for chatbot

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (text, for tracking conversation sessions)
      - `sender_type` (text, 'user' or 'bot' or 'admin')
      - `message` (text, the message content)
      - `lead_id` (uuid, optional link to leads table)
      - `ip_address` (text, user's IP address)
      - `metadata` (jsonb, for additional data like quick replies, etc.)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for public read/write access (for anonymous chat)
    - Add policies for authenticated admin access

  3. Indexes
    - Index on session_id for fast conversation retrieval
    - Index on created_at for chronological ordering
    - Index on sender_type for filtering
    - Index on lead_id for linking to leads
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

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_lead_id ON chat_messages(lead_id);

-- RLS Policies
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

CREATE POLICY "Allow authenticated users to manage chat messages"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();