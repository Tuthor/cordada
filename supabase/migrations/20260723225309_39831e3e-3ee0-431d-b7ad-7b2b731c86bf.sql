
CREATE TABLE public.cordada_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cordada_id uuid NOT NULL REFERENCES public.cordadas(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cordada_messages_cordada_created_idx
  ON public.cordada_messages (cordada_id, created_at DESC);
CREATE INDEX cordada_messages_recipient_unread_idx
  ON public.cordada_messages (recipient_id, is_read);

GRANT SELECT, INSERT, UPDATE ON public.cordada_messages TO authenticated;
GRANT ALL ON public.cordada_messages TO service_role;

ALTER TABLE public.cordada_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cordada_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cordada_messages;

CREATE OR REPLACE FUNCTION public.is_cordada_counterparty(
  _cordada_id uuid, _a uuid, _b uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH client AS (
    SELECT client_id AS uid FROM public.cordadas WHERE id = _cordada_id
  ),
  members AS (
    SELECT ca.user_id AS uid
    FROM public.cordada_members cm
    JOIN public.consultant_applications ca ON ca.id = cm.consultant_id
    WHERE cm.cordada_id = _cordada_id
  ),
  participants AS (SELECT uid FROM client UNION SELECT uid FROM members)
  SELECT _a <> _b
     AND EXISTS (SELECT 1 FROM participants WHERE uid = _a)
     AND EXISTS (SELECT 1 FROM participants WHERE uid = _b)
     AND (
       EXISTS (SELECT 1 FROM client WHERE uid = _a)
       OR EXISTS (SELECT 1 FROM client WHERE uid = _b)
     );
$$;

CREATE POLICY "Participants can read their messages"
  ON public.cordada_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Counterparties can send messages"
  ON public.cordada_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_cordada_counterparty(cordada_id, sender_id, recipient_id)
  );

CREATE POLICY "Recipient can mark as read"
  ON public.cordada_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);
