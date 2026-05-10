
-- Restrict p2p_orders SELECT to authenticated users only (hides payment_address from anonymous)
DROP POLICY IF EXISTS "Anyone can view active p2p orders" ON public.p2p_orders;
CREATE POLICY "Authenticated users can view active p2p orders"
ON public.p2p_orders
FOR SELECT
TO authenticated
USING (is_active = true);

-- Realtime channel authorization: restrict who can subscribe to which topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own topics" ON realtime.messages;
CREATE POLICY "Users can subscribe to own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- User-scoped channels include the user's id in the topic
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
  -- Admins can subscribe to admin-prefixed channels
  OR (realtime.topic() LIKE 'admin-%' AND public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Users can broadcast to own topics" ON realtime.messages;
CREATE POLICY "Users can broadcast to own topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE '%' || auth.uid()::text || '%'
  OR (realtime.topic() LIKE 'admin-%' AND public.has_role(auth.uid(), 'admin'))
);
