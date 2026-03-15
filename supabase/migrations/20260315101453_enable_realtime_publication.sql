/*
  # Enable Realtime for Chat Tables

  1. Changes
    - Add all chat tables to the supabase_realtime publication
    - This enables real-time subscriptions for postgres_changes events
    
  2. Tables Added to Realtime
    - `messages` - For real-time message updates
    - `participants` - For real-time participant status updates
    - `webrtc_signals` - For real-time WebRTC signaling
    - `typing_status` - For real-time typing indicators
    
  3. Notes
    - Without this, postgres_changes subscriptions will not receive events
    - This is required for the chat to update dynamically
*/

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;
