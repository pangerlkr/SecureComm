/*
  # Add Host Transfer Function

  1. New Functions
    - `transfer_host_on_leave(p_room_id text, p_leaving_user text)` - When the current host leaves,
      transfers host role to the next online participant alphabetically. If no one is left, clears host_name.

  2. Notes
    - Called from the client when the host disconnects
    - Safe to call even if the leaving user is not the host (no-op in that case)
*/

CREATE OR REPLACE FUNCTION transfer_host_on_leave(p_room_id text, p_leaving_user text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_host text;
BEGIN
  -- Only act if this user is currently the host
  IF NOT EXISTS (
    SELECT 1 FROM rooms WHERE id = p_room_id AND host_name = p_leaving_user
  ) THEN
    RETURN NULL;
  END IF;

  -- Find the next online participant who is not the leaving user
  SELECT user_name INTO v_next_host
  FROM participants
  WHERE room_id = p_room_id
    AND is_online = true
    AND user_name != p_leaving_user
  ORDER BY joined_at ASC
  LIMIT 1;

  -- Update the room's host_name
  UPDATE rooms
  SET host_name = COALESCE(v_next_host, '')
  WHERE id = p_room_id;

  RETURN v_next_host;
END;
$$;
