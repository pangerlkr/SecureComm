/*
  # Remove Unused Indexes and Fix Security Issues

  1. Index Cleanup
    - Remove unused indexes that have no query benefit:
      - idx_participants_is_online
      - idx_typing_status_room_id
      - idx_messages_created_at
      - idx_webrtc_signals_room_id
      - idx_webrtc_signals_to_user
      - idx_webrtc_signals_processed
      - idx_webrtc_signals_created_at

  2. Function Security Fixes
    - Set explicit search_path for all functions to prevent search path attacks
    - Functions affected:
      - cleanup_old_typing_status
      - cleanup_inactive_rooms
      - cleanup_old_signals
      - mark_signal_processed

  3. Important Notes
    - RLS policies remain permissive by design (zero-knowledge architecture)
    - This is an ephemeral, untrusted server relay system
    - Client-side encryption ensures data privacy
    - Server has no authentication context by design
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_participants_is_online;
DROP INDEX IF EXISTS idx_typing_status_room_id;
DROP INDEX IF EXISTS idx_messages_created_at;
DROP INDEX IF EXISTS idx_webrtc_signals_room_id;
DROP INDEX IF EXISTS idx_webrtc_signals_to_user;
DROP INDEX IF EXISTS idx_webrtc_signals_processed;
DROP INDEX IF EXISTS idx_webrtc_signals_created_at;

-- Fix function search paths to prevent security vulnerabilities

-- Update cleanup_old_typing_status function with explicit search_path
CREATE OR REPLACE FUNCTION cleanup_old_typing_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM typing_status
  WHERE updated_at < NOW() - INTERVAL '5 seconds';
END;
$$;

-- Update cleanup_inactive_rooms function with explicit search_path
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM rooms
  WHERE last_activity < NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1 FROM participants
    WHERE participants.room_id = rooms.id
    AND participants.is_online = true
  );
END;
$$;

-- Update cleanup_old_signals function with explicit search_path
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM webrtc_signals
  WHERE created_at < NOW() - INTERVAL '1 minute'
  AND (processed = true OR created_at < NOW() - INTERVAL '5 minutes');
END;
$$;

-- Update mark_signal_processed function with explicit search_path
CREATE OR REPLACE FUNCTION mark_signal_processed(signal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE webrtc_signals
  SET processed = true
  WHERE id = signal_id;
END;
$$;