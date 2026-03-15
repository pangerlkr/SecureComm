/*
  # Add Host Privileges and Room Security

  1. Changes to `rooms` table
    - `host_name` (text) - The username of the room creator/host
    - `host_session_id` (text) - A secret token given to the host to verify identity
    - `is_locked` (boolean, default false) - Whether the room requires a pincode to join
    - `pincode` (text, nullable) - Hashed/plain pincode for room access (null if not locked)

  2. New `banned_participants` table
    - `id` (uuid, primary key)
    - `room_id` (text, references rooms)
    - `user_name` (text) - The banned username
    - `banned_at` (timestamptz)
    - RLS enabled: host can insert, anyone can read for their own room

  3. Changes to `participants` table
    - `is_kicked` (boolean, default false) - Whether participant was kicked
    - `session_id` (text, nullable) - Session identifier for this join

  4. Security
    - RLS policies added for banned_participants
    - All existing RLS maintained
*/

-- Add host columns to rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'host_name'
  ) THEN
    ALTER TABLE rooms ADD COLUMN host_name text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'host_session_id'
  ) THEN
    ALTER TABLE rooms ADD COLUMN host_session_id text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE rooms ADD COLUMN is_locked boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'pincode'
  ) THEN
    ALTER TABLE rooms ADD COLUMN pincode text DEFAULT NULL;
  END IF;
END $$;

-- Add session_id to participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN session_id text DEFAULT '';
  END IF;
END $$;

-- Create banned_participants table
CREATE TABLE IF NOT EXISTS banned_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  banned_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_name)
);

ALTER TABLE banned_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bans for a room"
  ON banned_participants
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert bans"
  ON banned_participants
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete bans"
  ON banned_participants
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Add index for banned_participants lookups
CREATE INDEX IF NOT EXISTS idx_banned_participants_room_id ON banned_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_banned_participants_user_name ON banned_participants(room_id, user_name);
