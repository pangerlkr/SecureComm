/*
  # Enable Full Realtime on Core Tables

  1. Changes
    - Set REPLICA IDENTITY FULL on rooms, participants, messages, banned_participants
      so all column values are available in realtime UPDATE/DELETE payloads
    - Add all tables to supabase_realtime publication if not already present

  2. Notes
    - Required for postgres_changes filters to work reliably on UPDATE events
    - Especially needed for rooms.host_name and participants.is_online change detection
*/

ALTER TABLE rooms REPLICA IDENTITY FULL;
ALTER TABLE participants REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE banned_participants REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE participants;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'banned_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE banned_participants;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'webrtc_signals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signals;
  END IF;
END $$;
