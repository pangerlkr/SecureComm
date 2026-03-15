/*
  # SecureComm Chat Database Schema

  1. New Tables
    - `rooms`
      - `id` (text, primary key) - Unique room identifier
      - `created_at` (timestamptz) - Room creation timestamp
      - `last_activity` (timestamptz) - Last message or activity timestamp
      
    - `participants`
      - `id` (uuid, primary key)
      - `room_id` (text, foreign key to rooms)
      - `user_name` (text) - Participant display name
      - `is_online` (boolean) - Current online status
      - `joined_at` (timestamptz) - When participant joined
      - `last_seen` (timestamptz) - Last activity timestamp
      
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (text, foreign key to rooms)
      - `sender` (text) - Message sender name
      - `content` (text) - Message content (encrypted)
      - `type` (text) - Message type (text, image, video, file, system)
      - `file_name` (text, nullable) - File name if applicable
      - `file_size` (bigint, nullable) - File size if applicable
      - `encrypted` (boolean) - Whether message is encrypted
      - `created_at` (timestamptz) - Message timestamp
      
    - `typing_indicators`
      - `id` (uuid, primary key)
      - `room_id` (text, foreign key to rooms)
      - `user_name` (text) - User who is typing
      - `is_typing` (boolean) - Typing state
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Public read/write access for rooms (no auth required for this chat app)
    - Policies allow any user to read and write to any room
    - This is intentional as the app uses client-side E2E encryption

  3. Indexes
    - Index on room_id for faster message and participant lookups
    - Index on created_at for message ordering
    
  4. Functions
    - Auto-cleanup function to remove inactive rooms and typing indicators
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  is_online boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  UNIQUE(room_id, user_name)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  file_name text,
  file_size bigint,
  encrypted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  is_typing boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_room_id ON typing_indicators(room_id);

-- Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
-- Note: This is intentional as the app uses client-side E2E encryption

-- Rooms policies
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON rooms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON rooms FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Participants policies
CREATE POLICY "Anyone can view participants"
  ON participants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can add participants"
  ON participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
  ON participants FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can remove participants"
  ON participants FOR DELETE
  TO anon, authenticated
  USING (true);

-- Messages policies
CREATE POLICY "Anyone can view messages"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can send messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Typing indicators policies
CREATE POLICY "Anyone can view typing indicators"
  ON typing_indicators FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can add typing indicators"
  ON typing_indicators FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update typing indicators"
  ON typing_indicators FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can remove typing indicators"
  ON typing_indicators FOR DELETE
  TO anon, authenticated
  USING (true);

-- Function to clean up old typing indicators (older than 5 seconds)
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < now() - interval '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Function to update room activity timestamp
CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rooms
  SET last_activity = now()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update room activity when new message is sent
DROP TRIGGER IF EXISTS trigger_update_room_activity ON messages;
CREATE TRIGGER trigger_update_room_activity
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_room_activity();
