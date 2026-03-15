/*
  # Add mark_offline RPC function

  ## Purpose
  Provides a POST-callable RPC endpoint that can be used with navigator.sendBeacon
  to mark a participant as offline when the page unloads. sendBeacon always uses POST,
  so we cannot use the REST PATCH endpoint directly.

  ## New Functions
  - `mark_participant_offline(p_participant_id uuid)` - marks a participant as offline
    and triggers host transfer if needed. Accessible via POST /rpc/mark_participant_offline.

  ## Security
  - Function is SECURITY DEFINER to allow the update regardless of RLS
  - Only updates the specific participant row by ID
*/

CREATE OR REPLACE FUNCTION mark_participant_offline(
  p_participant_id uuid,
  p_room_id text DEFAULT NULL,
  p_user_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE participants
  SET is_online = false, last_seen = now()
  WHERE id = p_participant_id;

  IF p_room_id IS NOT NULL AND p_user_name IS NOT NULL THEN
    PERFORM transfer_host_on_leave(p_room_id, p_user_name);
  END IF;
END;
$$;
