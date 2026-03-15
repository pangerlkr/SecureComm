/*
  # Add Participant Cleanup Function

  1. New Functions
    - `cleanup_inactive_participants()` - Marks participants as offline if they haven't sent a heartbeat in 2 minutes
    
  2. Changes
    - Creates a function that can be called to clean up stale participant connections
    - Marks participants as offline if last_seen is older than 2 minutes
    
  3. Notes
    - This function should be called periodically to ensure accurate online status
    - Helps handle cases where users close the browser without proper cleanup
*/

-- Create function to cleanup inactive participants
CREATE OR REPLACE FUNCTION cleanup_inactive_participants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE participants
  SET is_online = false
  WHERE is_online = true
  AND last_seen < NOW() - INTERVAL '2 minutes';
END;
$$;
