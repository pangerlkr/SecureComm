/*
  # Create WebRTC Signaling Schema

  1. New Tables
    - `webrtc_signals`
      - `id` (uuid, primary key) - Unique signal ID
      - `room_id` (text, foreign key) - Reference to room
      - `from_user` (text) - Sender username
      - `to_user` (text) - Target username (null for broadcast)
      - `signal_type` (text) - Type: 'offer', 'answer', 'ice-candidate', 'call-start', 'call-end', 'call-reject'
      - `signal_data` (jsonb) - Signal payload (SDP, ICE candidate, etc)
      - `created_at` (timestamptz) - Signal timestamp
      - `processed` (boolean) - Whether signal has been consumed

  2. Security
    - Enable RLS on signals table
    - Allow public access for signaling (zero-knowledge, untrusted relay)
    - Signals are ephemeral and cleaned up automatically

  3. Indexes
    - Index on room_id for efficient queries
    - Index on to_user for targeted signal delivery
    - Index on processed for cleanup queries

  4. Important Notes
    - Server only relays WebRTC signaling data
    - All media encryption handled by WebRTC (DTLS-SRTP)
    - Signals auto-expire after processing or timeout
*/

-- Create webrtc_signals table
CREATE TABLE IF NOT EXISTS webrtc_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  from_user text NOT NULL,
  to_user text,
  signal_type text NOT NULL,
  signal_data jsonb,
  created_at timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_room_id ON webrtc_signals(room_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_to_user ON webrtc_signals(to_user);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_processed ON webrtc_signals(processed);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_created_at ON webrtc_signals(created_at);

-- Enable Row Level Security
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for webrtc_signals (public access for signaling)
CREATE POLICY "Anyone can view signals"
  ON webrtc_signals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can send signals"
  ON webrtc_signals FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update signal status"
  ON webrtc_signals FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete old signals"
  ON webrtc_signals FOR DELETE
  TO public
  USING (true);

-- Function to clean up old processed signals (older than 1 minute)
CREATE OR REPLACE FUNCTION cleanup_old_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM webrtc_signals
  WHERE created_at < NOW() - INTERVAL '1 minute'
  AND (processed = true OR created_at < NOW() - INTERVAL '5 minutes');
END;
$$ LANGUAGE plpgsql;

-- Function to mark signal as processed
CREATE OR REPLACE FUNCTION mark_signal_processed(signal_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE webrtc_signals
  SET processed = true
  WHERE id = signal_id;
END;
$$ LANGUAGE plpgsql;