/*
  # Stale Participant Cleanup

  ## Purpose
  Participants who close the browser unexpectedly (crash, kill tab, network drop)
  may never trigger the cleanup path, leaving them stuck as is_online=true.
  The heartbeat updates last_seen every 20 seconds, so anyone with last_seen
  older than 60 seconds has definitely disconnected.

  ## Changes
  1. Enable pg_cron extension
  2. Add `cleanup_stale_participants()` function that:
     - Marks participants offline if last_seen > 60 seconds ago
     - Triggers host transfer for any affected room
  3. Schedule the function to run every minute via pg_cron

  ## Security
  - Function is SECURITY DEFINER to bypass RLS for cleanup operations
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION cleanup_stale_participants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stale_record RECORD;
BEGIN
  FOR stale_record IN
    SELECT id, room_id, user_name
    FROM participants
    WHERE is_online = true
      AND last_seen < now() - interval '60 seconds'
  LOOP
    UPDATE participants
    SET is_online = false, last_seen = now()
    WHERE id = stale_record.id;

    PERFORM transfer_host_on_leave(stale_record.room_id::text, stale_record.user_name);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'cleanup-stale-participants',
  '* * * * *',
  'SELECT cleanup_stale_participants()'
);
