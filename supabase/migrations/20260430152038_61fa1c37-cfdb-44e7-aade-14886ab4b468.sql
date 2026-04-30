-- 1. Restrict access_token column on github_connections
REVOKE SELECT (access_token) ON public.github_connections FROM authenticated, anon;
REVOKE UPDATE (access_token) ON public.github_connections FROM authenticated, anon;
REVOKE INSERT (access_token) ON public.github_connections FROM authenticated, anon;

-- 2. Lock down user_roles INSERT/DELETE/UPDATE so clients cannot self-assign roles
-- (No policies = no access for non-service-role; explicit restrictive policies for clarity)
CREATE POLICY "Block client inserts on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "Block client updates on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false);

CREATE POLICY "Block client deletes on user_roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- 3. RLS on realtime.messages — scope topic by auth.uid()
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can subscribe to their own topic"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('user:' || auth.uid()::text)
  );

CREATE POLICY "Users can broadcast to their own topic"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = ('user:' || auth.uid()::text)
  );