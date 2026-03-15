/*
  # Add Missing Foreign Key Index

  1. Performance Optimization
    - Add index on `webrtc_signals.room_id` to optimize foreign key lookups
    - This improves JOIN performance and ensures efficient CASCADE operations

  2. Important Notes on RLS Policies
    - RLS policies flagged as "always true" are INTENTIONAL by design
    - This application uses a zero-knowledge architecture where:
      * Server operates as an untrusted relay (see SECURITY.md)
      * All encryption happens client-side
      * Server never has access to encryption keys
      * No authentication system exists by design
    - Security is provided through end-to-end encryption, not access control
    - Permissive RLS policies allow the relay functionality while RLS remains enabled

  3. Auth DB Connection Strategy
    - This is a Supabase dashboard configuration setting
    - Cannot be changed via SQL migrations
    - Must be configured in Supabase project settings if needed
*/

-- Add index on foreign key for optimal query performance
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_room_id_fk 
ON webrtc_signals(room_id);
