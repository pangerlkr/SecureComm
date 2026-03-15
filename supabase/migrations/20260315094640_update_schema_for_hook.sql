/*
  # Update Schema for Hook Compatibility

  1. Changes to Tables
    - `messages`
      - Rename `timestamp` column to `created_at` for consistency
    
    - `participants`
      - Add `last_seen` column for heartbeat tracking
      - Make `socket_id` nullable (not required anymore)

  2. Important Notes
    - These changes ensure compatibility with the useSupabaseChat hook
    - Preserves all existing data
    - Uses safe operations to prevent errors
*/

-- Add last_seen to participants if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE participants ADD COLUMN last_seen timestamptz DEFAULT now();
  END IF;
END $$;

-- Rename timestamp to created_at in messages if not already done
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'timestamp'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE messages RENAME COLUMN timestamp TO created_at;
  END IF;
END $$;

-- Make socket_id nullable in participants
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' 
    AND column_name = 'socket_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE participants ALTER COLUMN socket_id DROP NOT NULL;
  END IF;
END $$;

-- Drop the unique constraint on (room_id, socket_id) if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'participants'
    AND constraint_name = 'participants_room_id_socket_id_key'
  ) THEN
    ALTER TABLE participants DROP CONSTRAINT participants_room_id_socket_id_key;
  END IF;
END $$;

-- Create index on messages.created_at if not exists (replacing timestamp index)
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Drop old timestamp index if it exists
DROP INDEX IF EXISTS idx_messages_timestamp;