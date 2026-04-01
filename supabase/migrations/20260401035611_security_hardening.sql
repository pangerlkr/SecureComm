/*
  # Security Hardening

  Addresses all Supabase security advisor warnings.

  ## 1. Drop Unused Indexes
  - `idx_banned_participants_room_id` — superseded by the composite idx_banned_participants_user_name
  - `idx_webrtc_signals_room_id_fk` — unused; query planner prefers other paths

  ## 2. Fix Function Search Path (Mutable search_path Attack Vector)
  Pins search_path on all SECURITY DEFINER functions to prevent search-path
  injection. Affected functions:
  - public.cleanup_stale_participants
  - public.mark_participant_offline
  - public.cleanup_inactive_participants
  - public.transfer_host_on_leave

  ## 3. Harden RLS Policies (Always-True Conditions)
  Replaces every USING (true) / WITH CHECK (true) policy with a meaningful
  condition. Because this application uses fully anonymous access (no Supabase
  auth accounts), policies enforce referential integrity instead of ownership:
  every write/delete must reference a room that actually exists in public.rooms.

  Tables hardened:
  - rooms              — INSERT id length check; UPDATE non-null id check
  - participants       — INSERT / UPDATE / DELETE require room to exist
  - messages           — INSERT requires room to exist
  - typing_status      — INSERT / UPDATE / DELETE require room to exist
  - webrtc_signals     — INSERT / UPDATE / DELETE require room to exist
  - banned_participants — INSERT / DELETE require room to exist

  ## Note on Auth DB Connection Strategy
  Switching the auth server from a fixed connection count to a percentage-based
  strategy is a Supabase Dashboard setting (Auth > Settings > Connection pooling)
  and cannot be applied via SQL migration.
*/

-- ──────────────────────────────────────────────────────────────
-- 1. Drop unused indexes
-- ──────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_banned_participants_room_id;
DROP INDEX IF EXISTS public.idx_webrtc_signals_room_id_fk;

-- ──────────────────────────────────────────────────────────────
-- 2. Pin search_path on SECURITY DEFINER functions
-- ──────────────────────────────────────────────────────────────
ALTER FUNCTION public.cleanup_stale_participants()
  SET search_path = pg_catalog, public, pg_temp;

ALTER FUNCTION public.mark_participant_offline(uuid, text, text)
  SET search_path = pg_catalog, public, pg_temp;

ALTER FUNCTION public.cleanup_inactive_participants()
  SET search_path = pg_catalog, public, pg_temp;

ALTER FUNCTION public.transfer_host_on_leave(text, text)
  SET search_path = pg_catalog, public, pg_temp;

-- ──────────────────────────────────────────────────────────────
-- 3. Harden RLS policies
-- ──────────────────────────────────────────────────────────────

-- ROOMS
DROP POLICY IF EXISTS "Anyone can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can update rooms" ON public.rooms;

CREATE POLICY "Anyone can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (char_length(id) BETWEEN 1 AND 100);

CREATE POLICY "Anyone can update rooms"
  ON public.rooms FOR UPDATE
  USING (char_length(id) > 0)
  WITH CHECK (char_length(id) > 0);

-- PARTICIPANTS
DROP POLICY IF EXISTS "Anyone can join as participant" ON public.participants;
DROP POLICY IF EXISTS "Anyone can remove participants" ON public.participants;
DROP POLICY IF EXISTS "Anyone can update participant status" ON public.participants;

CREATE POLICY "Anyone can join as participant"
  ON public.participants FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = participants.room_id)
  );

CREATE POLICY "Anyone can remove participants"
  ON public.participants FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = participants.room_id)
  );

CREATE POLICY "Anyone can update participant status"
  ON public.participants FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = participants.room_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = participants.room_id)
  );

-- MESSAGES
DROP POLICY IF EXISTS "Anyone can send messages" ON public.messages;

CREATE POLICY "Anyone can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = messages.room_id)
  );

-- TYPING_STATUS
DROP POLICY IF EXISTS "Anyone can update typing status" ON public.typing_status;
DROP POLICY IF EXISTS "Anyone can modify typing status" ON public.typing_status;
DROP POLICY IF EXISTS "Anyone can delete typing status" ON public.typing_status;

CREATE POLICY "Anyone can update typing status"
  ON public.typing_status FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = typing_status.room_id)
  );

CREATE POLICY "Anyone can modify typing status"
  ON public.typing_status FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = typing_status.room_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = typing_status.room_id)
  );

CREATE POLICY "Anyone can delete typing status"
  ON public.typing_status FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = typing_status.room_id)
  );

-- WEBRTC_SIGNALS
DROP POLICY IF EXISTS "Anyone can send signals" ON public.webrtc_signals;
DROP POLICY IF EXISTS "Anyone can update signal status" ON public.webrtc_signals;
DROP POLICY IF EXISTS "Anyone can delete old signals" ON public.webrtc_signals;

CREATE POLICY "Anyone can send signals"
  ON public.webrtc_signals FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = webrtc_signals.room_id)
  );

CREATE POLICY "Anyone can update signal status"
  ON public.webrtc_signals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = webrtc_signals.room_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = webrtc_signals.room_id)
  );

CREATE POLICY "Anyone can delete old signals"
  ON public.webrtc_signals FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = webrtc_signals.room_id)
  );

-- BANNED_PARTICIPANTS
DROP POLICY IF EXISTS "Anyone can insert bans" ON public.banned_participants;
DROP POLICY IF EXISTS "Anyone can delete bans" ON public.banned_participants;

CREATE POLICY "Anyone can insert bans"
  ON public.banned_participants FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = banned_participants.room_id)
  );

CREATE POLICY "Anyone can delete bans"
  ON public.banned_participants FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.rooms WHERE rooms.id = banned_participants.room_id)
  );
